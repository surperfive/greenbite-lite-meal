"""把用户给的「标准份」六宫格照片切成六张透明底抠图。

源图 1678x937，六件菜品不是严格的 3x2 网格（拼图有错落），所以先做连通块分析
自动取六个 bbox，再逐块 GrabCut + 去白边 + 方形归一化。

归一化口径必须和 public/dishes/large 完全一致（最长边 = 画布 89%），
否则详情页切份量时两张图会对不上尺寸。

输出：public/dishes/standard/dish-*.png
"""
import os
import numpy as np
import cv2
from PIL import Image

SRC = r'C:\Users\OOW\.workbuddy\clipboard-images\clipboard-2026-10-23T04-16-51-660Z-cf52af2f.jpg'
OUT = r'C:\Users\OOW\Downloads\qing (2)\public\dishes\standard'
os.makedirs(OUT, exist_ok=True)

# 与源图排版一致的顺序：上排 沙拉 / 三明治 / 奶昔，下排 照烧锅 / 拿铁 / 酸奶
NAMES = [
    'dish-avocado-chicken-salad',
    'dish-tuna-sandwich',
    'dish-kale-smoothie',
    'dish-teriyaki-pot',
    'dish-coldbrew-latte',
    'dish-greek-yogurt',
]

PAD = 12  # 裁切外扩，给 GrabCut 留边界

# 酸奶杯是玻璃碗 + 白色酸奶，**不能做去白边**：
# 那一步会把"靠近透明区的纯白像素"的 alpha 打折，于是碗里白花花的酸奶
# 在深色 hero 上变成一片片半透明斑（看着像脏了）。这只碗的白是主体，不是残边。
NO_WHITE_EDGE = {'dish-greek-yogurt'}

img = cv2.imread(SRC, cv2.IMREAD_COLOR)
H, W = img.shape[:2]

# --- 1. 自动定位六个菜品（轻膨胀只为把同一件菜的碎片连起来，不会越过邻菜）---
mask = (img.min(axis=2) < 240).astype(np.uint8)
mask_d = cv2.dilate(mask, np.ones((3, 3), np.uint8), iterations=1)
n, lab, stats, _ = cv2.connectedComponentsWithStats(mask_d, 8)
boxes = [(stats[i][0], stats[i][1], stats[i][0] + stats[i][2], stats[i][1] + stats[i][3])
         for i in range(1, n) if stats[i][4] > 30000]
boxes.sort(key=lambda b: ((b[1] + b[3]) // 2 // (H // 2), (b[0] + b[2]) // 2))
assert len(boxes) == 6, f'期望 6 块，实际 {len(boxes)}：{boxes}'
print('检测到的 bbox：')
for nm, b in zip(NAMES, boxes):
    print(f'  {nm:32s} {b}')

for name, (x0, y0, x1, y1) in zip(NAMES, boxes):
    ax0, ay0 = max(0, x0 - PAD), max(0, y0 - PAD)
    ax1, ay1 = min(W, x1 + PAD), min(H, y1 + PAD)
    crop = img[ay0:ay1, ax0:ax1].copy()
    ch, cw = crop.shape[:2]

    # --- GrabCut：矩形初始化 ---
    m = np.zeros((ch, cw), np.uint8)
    bgd, fgd = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
    cv2.grabCut(crop, m, (2, 2, cw - 4, ch - 4), bgd, fgd, 6, cv2.GC_INIT_WITH_RECT)
    fg = np.where((m == cv2.GC_FGD) | (m == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)

    # --- 只留最大主体 ---
    nc, lb, st, _ = cv2.connectedComponentsWithStats(fg, 8)
    if nc > 1:
        idx = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))
        fg = np.where(lb == idx, 255, 0).astype(np.uint8)

    # --- 闭运算补内部空洞 ---
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    fg = cv2.morphologyEx(fg, cv2.MORPH_CLOSE, k, iterations=2)

    # --- 羽化 1px ---
    fg = cv2.erode(fg, np.ones((3, 3), np.uint8), iterations=1)
    alpha = cv2.GaussianBlur(fg, (3, 3), 0.7)

    rgb = cv2.cvtColor(crop, cv2.COLOR_BGR2RGB).astype(np.float32)

    # --- 去白边：边缘带（距透明区 <=3px）里接近白的像素换成推出来的前景色 ---
    # 玻璃碗装白色内容物的那道不参与，理由见 NO_WHITE_EDGE 的注释。
    if name not in NO_WHITE_EDGE:
        dist = cv2.distanceTransform((alpha < 8).astype(np.uint8), cv2.DIST_L2, 5)

        seed = ((alpha > 250) & (dist > 3.5)).astype(np.float32)
        mm = seed.copy()
        col = rgb.copy()
        for _ in range(8):
            w = mm[..., None]
            num = cv2.boxFilter(col * w, -1, (3, 3), normalize=False)
            den = cv2.boxFilter(w, -1, (3, 3), normalize=False)
            fill = num / np.maximum(den, 1e-6)[..., None]
            newly = (den > 0.001) & (mm < 0.999)
            col = np.where(newly[..., None], fill, col)
            mm = np.where(den > 0.001, np.float32(1.0), mm)

        band = (dist <= 3.0) & (alpha > 8)
        lum = rgb.mean(axis=2)
        sat = rgb.max(axis=2) - rgb.min(axis=2)
        whiteish = band & (lum > 232) & (sat < 16)
        fac = np.clip((250.0 - lum) / 26.0, 0.0, 1.0)
        alpha = np.where(whiteish, np.clip(alpha * fac, 0, 255), alpha).astype(np.uint8)
        rgb = np.where(whiteish[..., None], col, rgb)
    alpha = cv2.GaussianBlur(alpha, (3, 3), 0.6)

    rgba = np.dstack([np.clip(rgb, 0, 255).astype(np.uint8), alpha])
    im = Image.fromarray(rgba, 'RGBA')

    # --- 按 alpha bbox 收紧 -> 补正方形（6% 边距）-> 560 ---
    im = im.crop(im.split()[3].getbbox())
    w, h = im.size
    side = int(max(w, h) * 1.12)
    canvas = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    canvas.paste(im, ((side - w) // 2, (side - h) // 2), im)
    # ⚠️ 必须先转预乘 alpha（'RGBa'）再 resize。
    # 直接 resize RGBA 的话，透明区的 RGB=0 会被 LANCZOS 混进相邻不透明像素，
    # 玻璃器皿内部就会出现一片片"近黑"的暗斑（alpha 还是 255，看着像脏点）。
    canvas = canvas.convert('RGBa').resize((560, 560), Image.LANCZOS).convert('RGBA')

    path = os.path.join(OUT, name + '.png')
    canvas.save(path)
    print(f'{name:32s} crop {cw}x{ch} content {w}x{h} -> {path}')
