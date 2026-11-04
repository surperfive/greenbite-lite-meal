"""
把用户提供的「点餐页商品图」（2 行 × 3 列，纯白底棚拍）拆成 6 张透明 PNG。

为什么要这么绕（都是踩过的坑）：
  1. **不能按固定格子切**：三明治横向很宽、酸奶杯的勺子向右上探出，按 1/3 宽切会把它们
     直接切断。改成**全图连通域**聚类，再按「上/下两行 + 左中右」排成阅读顺序。
  2. **小件要跟着主体走**：拿铁旁边散着几颗咖啡豆，是独立连通域，只取最大的 6 块会把豆子丢掉。
     所以按「质心落进哪个主体的外扩包围盒」把碎片归并给最近的主体。
  3. **白底要抠掉**：卡片自己是浅色底（#F8FAFC / 分类渐变），留着白底会露出一块更白的方块。
     只清**与画布边缘连通**的白（flood fill 语义），主体内部的白色（酸奶、白瓷碗、面包瓤）
     不会被打洞；主体自带的柔和接触阴影不是纯白，会被保留。

用法：
  python scripts/split-dish-photos.py <源图> [输出目录]
默认输出到 public/dishes/，每张 512×512 透明 PNG。
"""
import colorsys
import os
import sys

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

# 6 个位置 → 文件名，顺序 = 源图「第一行左中右、第二行左中右」
NAMES = [
    'dish-avocado-chicken-salad',  # 牛油果鸡胸沙拉
    'dish-tuna-sandwich',          # 金枪鱼三明治
    'dish-kale-smoothie',          # 羽衣甘蓝酸奶昔
    'dish-teriyaki-pot',           # 日式照烧鸡肉锅
    'dish-coldbrew-latte',         # 冷萃燕麦拿铁
    'dish-greek-yogurt',           # 希腊酸奶杯
]

WHITE_TOL = 14      # 与纯白的最大通道差 < 该值即视为「白」
MIN_AREA = 1500     # 小于该面积的连通域视为噪点/灰尘
MERGE_PAD = 48      # 碎片归并时主体包围盒的外扩像素
OUT_SIZE = 512
CUTOUT_SIZE = 320   # --cutout 导出尺寸
PAD_RATIO = 0.05    # 主体四周留白（相对正方形边长）
CORE_DEV = 45       # 与白底差 > 该值才算主体核心（用来区分「食物」和「投影」）

# 自动取色（仅用于 TINTS 里没有的新菜）：只统计有彩度的像素
CHROMA_S = 0.22
CHROMA_V = 0.12
TINT_S = 0.62
TINT_L = 0.88

# ── 纯色底 ──
# 为什么这 6 个是手选而不是全自动取色：
#   自动取「彩度加权圆周平均色相」跑出来的结果是 —— 沙拉 43°、三明治 32°、照烧锅 25°、
#   拿铁 27°、酸奶 25°，**五张几乎全是米黄**（沙拉的浅色陶碗 + 三明治的吐司 + 照烧酱
#   + 咖啡 + 酸奶里的麦片，占面积太大，把色相拉平了）。一张卡 92px，米黄和米黄放一起
#   根本分不出是什么菜，等于没做。所以按「这道菜看起来是什么颜色」人工定色，
#   色相参考实测数据（抹茶奶昔 70°、拿铁 27° 等），再拉开彼此的差距。
# 未列出的菜仍走 `food_tint()` 自动取色兜底。
TINTS = {
    'dish-avocado-chicken-salad': '#E9F4D8',  # 牛油果 + 生菜：黄绿
    'dish-tuna-sandwich':         '#F8E9D2',  # 全麦吐司：米黄
    'dish-kale-smoothie':         '#D6EFBC',  # 羽衣甘蓝：正绿（比沙拉更饱和，拉开差距）
    'dish-teriyaki-pot':          '#FBE0C7',  # 照烧酱：橙棕
    'dish-coldbrew-latte':        '#EEE0D2',  # 咖啡 + 燕麦奶：奶咖（低饱和，区别于照烧）
    'dish-greek-yogurt':          '#FBE0E9',  # 草莓 + 蓝莓：淡粉
}


def drop_contact_shadow(cutout: Image.Image) -> Image.Image:
    """把「白底上的接触投影」从 alpha 里剔掉，只留主体轮廓。

    判定：像素与纯白的最大通道差 > CORE_DEV 才算主体核心（白瓷碗、玻璃杯的高光虽然也浅，
    但边缘/纹理够深，闭运算会把中间补上）；再做 5×5 闭运算 + 填洞还原完整轮廓。
    轮廓外的浅灰（就是那块投影）alpha 直接归零。
    """
    arr = np.asarray(cutout.convert('RGBA'))
    rgb = arr[:, :, :3].astype(np.int16)
    a0 = arr[:, :, 3]
    dev = (255 - rgb).max(axis=2)

    core = (dev > CORE_DEV) & (a0 > 0)
    sil = ndimage.binary_closing(core, structure=np.ones((5, 5), bool), iterations=4)
    sil = ndimage.binary_fill_holes(sil)

    alpha = np.where(sil, 255, 0).astype(np.uint8)
    out = Image.merge('RGBA', (*cutout.convert('RGB').split(), Image.fromarray(alpha, 'L')))
    return out.filter(ImageFilter.GaussianBlur(0.5))


def food_tint(cutout: Image.Image) -> tuple[int, int, int]:
    """按食物自身的代表色，算一个浅色纯底。

    做法：把不透明像素转 HSV，只留有彩度的部分（去掉白瓷盘、酸奶、纯黑阴影），
    再对色相做**加权圆周平均**（权重 = S×V）—— 直接取 RGB 均值会被大片白色拉成灰，
    直接取众数又容易被某一小块高饱和配菜带偏；按彩度加权能落在「看起来就是这盘菜」的色相上。
    明度/饱和度固定压到浅色档，保证照片主体仍然跳出来。
    """
    arr = np.asarray(cutout.convert('RGBA'))
    alpha = arr[:, :, 3] > 200
    hsv = np.asarray(cutout.convert('HSV'), dtype=np.float32)

    h = hsv[:, :, 0][alpha] / 255.0 * 2 * np.pi
    s = hsv[:, :, 1][alpha] / 255.0
    v = hsv[:, :, 2][alpha] / 255.0

    keep = (s >= CHROMA_S) & (v >= CHROMA_V)
    if not keep.any():
        return (244, 246, 249)
    w = (s * v)[keep]
    hx = np.cos(h[keep]) @ w
    hy = np.sin(h[keep]) @ w
    hue = (np.arctan2(hy, hx) / (2 * np.pi)) % 1.0

    r, g, b = colorsys.hls_to_rgb(hue, TINT_L, TINT_S)
    return (round(r * 255), round(g * 255), round(b * 255))


def main() -> None:
    src = sys.argv[1] if len(sys.argv) > 1 else r'C:\Users\OOW\.workbuddy-ai\clipboard-images\clipboard-2026-10-20T17-17-58-942Z-2ffbc58b.jpg'
    out_dir = sys.argv[2] if len(sys.argv) > 2 else os.path.join('public', 'dishes')
    # 可选：同时导出透明底 cutout，便于日后换底色（`--cutout <目录>`）
    cutout_dir = None
    if '--cutout' in sys.argv:
        cutout_dir = sys.argv[sys.argv.index('--cutout') + 1]
    os.makedirs(out_dir, exist_ok=True)

    img = Image.open(src).convert('RGB')
    W, H = img.size
    arr = np.asarray(img, dtype=np.int16)
    near_white = (255 - arr).max(axis=2) < WHITE_TOL

    # ── 1. 外部白底 = 与画布边缘连通的白 ──
    lab_w, n_w = ndimage.label(near_white)
    border_labels = set(lab_w[0]) | set(lab_w[-1]) | set(lab_w[:, 0]) | set(lab_w[:, -1])
    border_labels.discard(0)
    outside = np.isin(lab_w, list(border_labels))
    subject = ~outside

    # ── 2. 主体连通域，丢掉噪点 ──
    lab, n = ndimage.label(subject)
    areas = ndimage.sum(subject, lab, range(1, n + 1))
    keep = [i + 1 for i, a in enumerate(areas) if a >= MIN_AREA]
    print(f'source {W}x{H} · 连通域 {n} 个，保留 {len(keep)} 个')

    # ── 3. 按面积取前 6 大当主体，其余碎片归并给最近的主体 ──
    boxes = {l: ndimage.find_objects(lab == l)[0] for l in keep}
    order = sorted(keep, key=lambda l: areas[l - 1], reverse=True)
    mains = order[:6]
    rest = order[6:]

    groups = {m: [m] for m in mains}
    for l in rest:
        ys, xs = np.where(lab == l)
        cy, cx = ys.mean(), xs.mean()
        best, best_d = None, 1e9
        for m in mains:
            sy, sx = boxes[m]
            dy = max(sy.start - MERGE_PAD - cy, 0, cy - (sy.stop + MERGE_PAD))
            dx = max(sx.start - MERGE_PAD - cx, 0, cx - (sx.stop + MERGE_PAD))
            d = dy * dy + dx * dx
            if d < best_d:
                best, best_d = m, d
        if best is not None:
            groups[best].append(l)

    # ── 4. 按「两行 × 三列」排成阅读顺序 ──
    def center(m):
        sy, sx = boxes[m]
        return (sy.start + sy.stop) / 2, (sx.start + sx.stop) / 2

    def sort_key(m):
        cy, cx = center(m)
        return (0 if cy < H / 2 else 1, cx)

    mains.sort(key=sort_key)

    # ── 5. 逐张导出 ──
    for idx, m in enumerate(mains):
        members = groups[m]
        # ⚠️ alpha 只保留**本主体的连通域**，不能直接用「非外部白」的全局掩码：
        # 酸奶杯包围盒上沿（y=449）和抹茶奶昔的杯底（y≈470）有 21px 重叠，
        # 矩形裁剪会把隔壁的杯底一起拍进来。按 label 过滤后，邻居像素 alpha=0 自然消失。
        alpha_full = np.where(np.isin(lab, members), 255, 0).astype(np.uint8)

        y0 = min(boxes[l][0].start for l in members)
        y1 = max(boxes[l][0].stop for l in members)
        x0 = min(boxes[l][1].start for l in members)
        x1 = max(boxes[l][1].stop for l in members)

        # ⚠️ 只取紧包围盒，然后**在透明画布上居中补成正方形**。
        # 不要像以前那样「以中心为圆心扩成正方形再裁」—— 三明治 594×361 扩成 653×653 时
        # 下沿会伸进下一行的拿铁杯里，把邻居拍进来。补透明边永远不会越界。
        pad = int(max(y1 - y0, x1 - x0) * PAD_RATIO)
        # ⚠️ 必须夹紧到画布内：抹茶奶昔的吸管顶到 y=1，减掉 pad 会变成负坐标，
        # 负索引会让 numpy 切片从尾部取 → 整张 alpha 变全透明。
        bx0, by0 = max(0, x0 - pad), max(0, y0 - pad)
        bx1, by1 = min(W, x1 + pad), min(H, y1 + pad)
        bw, bh = bx1 - bx0, by1 - by0
        side = max(bw, bh)

        piece = img.crop((bx0, by0, bx1, by1))
        a = Image.fromarray(alpha_full[by0:by1, bx0:bx1], 'L')

        ox, oy = (side - bw) // 2, (side - bh) // 2
        canvas = Image.new('RGBA', (side, side), (0, 0, 0, 0))
        canvas.paste(piece, (ox, oy))
        alpha_canvas = Image.new('L', (side, side), 0)
        alpha_canvas.paste(a, (ox, oy))

        canvas = canvas.resize((OUT_SIZE, OUT_SIZE), Image.LANCZOS)
        alpha_canvas = alpha_canvas.resize((OUT_SIZE, OUT_SIZE), Image.LANCZOS).filter(ImageFilter.GaussianBlur(0.6))
        cutout = Image.merge('RGBA', (*canvas.split()[:3], alpha_canvas))

        # ── 5b. 去掉原图自带的接触阴影 ──
        # 原片的柔和投影是「白底上的浅灰」，一旦铺到彩色底上就变成一块**发白的光斑**
        # （三明治下方那块最明显）。投影本身是拍在白纸上的，跟纯色底在物理上就对不上，
        # 所以直接不要：只保留「与白底差异够大」的主体核心，闭运算 + 填洞还原轮廓，
        # 轮廓外的浅灰投影一律 alpha=0。比重新给纯色底算一个彩色投影干净得多。
        cutout = drop_contact_shadow(cutout)

        # ── 6. 按食物本身的主色调铺一层纯色底 ──
        hex_tint = TINTS.get(NAMES[idx])
        if hex_tint:
            bg_rgb = tuple(int(hex_tint[i:i + 2], 16) for i in (1, 3, 5))
        else:
            bg_rgb = food_tint(cutout)
        flat = Image.new('RGB', cutout.size, bg_rgb)
        flat.paste(cutout, (0, 0), cutout)
        path = os.path.join(out_dir, f'{NAMES[idx]}.jpg')
        flat.save(path, quality=92, optimize=True, subsampling=0)
        print(f'  ✓ {NAMES[idx]}.jpg  bg=#{bg_rgb[0]:02X}{bg_rgb[1]:02X}{bg_rgb[2]:02X}  {os.path.getsize(path) // 1024} KB')

        if cutout_dir:
            os.makedirs(cutout_dir, exist_ok=True)
            # cutout 只给点餐页 92px 的圆框用（含 2x/3x 屏），320 足够，别按 512 存白占体积
            cutout.resize((CUTOUT_SIZE, CUTOUT_SIZE), Image.LANCZOS).save(
                os.path.join(cutout_dir, f'{NAMES[idx]}.png'), optimize=True)
            # ⚠️⚠️ 这里导出的 PNG **边缘带白边**：alpha 是二值（0/255），靠 resize + GaussianBlur
            # 才变半透明，而 RGB 没做预乘 → 缩放时白背景被混进边缘像素（实测边缘亮度比内部
            # 高 76~103），放在彩色品类色块上就是一圈"没扣干净"的白。
            # 所以**每次重跑本脚本后，必须接着跑**：
            #     python scripts/fix-cutout-fringe.py
            # 它做反预乘 + 边缘色渗（+ 玻璃杯壁透明化白名单），幂等、从备份读。
            print('  ⚠️ 别忘了跑 scripts/fix-cutout-fringe.py 修边缘白边')


if __name__ == '__main__':
    main()
