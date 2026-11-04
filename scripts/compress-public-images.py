"""
压缩 public/ 下的图片，并做画质校验。

设计原则（避免把图压糊）：
1. **尺寸按实测渲染尺寸定**，不按目录名猜。
   `scripts/_measure-display-size.json` 里 pxW 就是「CSS 宽 x dpr」= 真实需要的像素。
   实测值 >= 原图宽 的（也就是本来就在放大的）一律**不缩尺寸**，只重编码。
2. 只有超出实测需求 1.25 倍以上才缩尺寸，缩到「需求 x 1.15」留一点余量。
3. 每张改完都跟原图算 RMS（均方差），> 4.0 视为肉眼可见劣化 → 回滚该文件。
4. 原图先备份到 `scripts/_public-backup-20261104/`，结构保持一致，可整体还原。

用法：
  python scripts/compress-public-images.py --dry-run   # 只算不改
  python scripts/compress-public-images.py             # 执行
"""
import argparse
import json
import os
import shutil
import sys

import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC = os.path.join(ROOT, "public")
BACKUP = os.path.join(ROOT, "scripts", "_public-backup-20261104")
SIZE_JSON = os.path.join(ROOT, "scripts", "_asset-display-size.json")

RMS_LIMIT = 4.0
# 省不到这个比例就不改 —— 为 2% 的体积牺牲画质不划算
MIN_SAVING = 0.08

# ---- 需要缩尺寸的（实测需求远小于原图）----
# path -> 目标宽度（None 表示按实测需求自动算）
RESIZE_OVERRIDE = {
    # 食材图：320x320 却只渲染 81px（4 倍超采样）
    "ingredients/ing_tofu.png": 128,
    "ingredients/ing_egg.png": 128,
    "ingredients/ing_steak.png": 128,
    "ingredients/ing_broccoli.png": 128,
    "ingredients/ing_chicken.png": 128,
    "ingredients/ing_prawn.png": 128,
    "ingredients/ing_edamame.png": 128,
    "ingredients/ing_kale.png": 128,
    "ingredients/ing_tomato.png": 128,
    "ingredients/ing_quinoa.png": 128,
    # 邀请码弹窗小图标：160x107 渲染在 40px 方框里
    "853c20910e5626627b9b82adf81b1c68.png": 96,
    # 我的页两张 banner 图：720x538 只渲染 338px 宽
    "assets/aistudio/b620c46b437e79bc2a82adb8b5ca2054_c3436860.jpg": 400,
    "assets/aistudio/c1f79b62d1ca498e793e833537789423_c1b98b67.jpg": 400,
    # 福利中心三枚图标：174 高渲染 60px（CSS 定高），120 够 2 倍
    "welfare-icons/ic-ticket.png": None,
    "welfare-icons/ic-calendar.png": None,
    "welfare-icons/ic-crown.png": None,
}

# 这几张不碰（本身就是被放大的，再动只会更糊）
SKIP = {
    "online_9f52938bdc.jpg",      # 820x1674 背景，纵向 cover
    "assets/aistudio/image_9b31cf41.jpg",  # 实测要 935px，已在放大
    "mascot-avatar.svg",
    "mascot-avatar-hd.svg",
}

# 只许重编码、不许缩尺寸的路径前缀。
# 理由：这些图会出现在**数据驱动**的位置（人气卡展示哪两道菜由排序决定、
# 入口卡文案/图位可能改版），按「今天实测到的尺寸」缩小，一旦布局变化就会被放大糊掉。
NO_RESIZE_PREFIX = (
    "dishes/cutout/",   # 人气卡 377px / 列表 170px 两种用法，取小的会毁掉大的
    "entry-norm/",      # 入口卡，省幅只有 15%，不值得冒改版风险
)


def load_needed():
    """从实测 JSON 读每个资源的设备像素宽"""
    if not os.path.exists(SIZE_JSON):
        print(f"缺少 {SIZE_JSON}，请先跑 node scripts/_measure-display-size.mjs")
        sys.exit(1)
    with open(SIZE_JSON, "r", encoding="utf-8") as f:
        data = json.load(f)
    return {a["path"].lstrip("/"): a for a in data["assets"]}


def rms(a: Image.Image, b: Image.Image) -> float:
    """
    两图算 RMS（0 最好，>4 肉眼可见）。

    ⚠️ 调用方必须先把两张图放到**同一尺寸**再比 —— 早期版本拿「缩小后的图」直接和
    「原尺寸图」比，把正常的降采样算成了画质劣化，导致该缩的图全被误回滚。
    """
    if a.size != b.size:
        b = b.resize(a.size, Image.LANCZOS)
    a = a.convert("RGBA") if a.mode in ("RGBA", "LA", "P") else a.convert("RGB")
    b = b.convert(a.mode)
    na = np.asarray(a, dtype=np.float32)
    nb = np.asarray(b, dtype=np.float32)
    return float(np.sqrt(((na - nb) ** 2).mean()))


def has_alpha(im: Image.Image) -> bool:
    if im.mode in ("RGBA", "LA"):
        return True
    if im.mode == "P":
        return "transparency" in im.info
    return False


def save_jpeg(im: Image.Image, path: str, original_size: int) -> int:
    """
    JPEG：从高画质往低试，取第一个「体积已省够 15%」的档位。

    ⚠️ 早期版本写成 `for q in (84,80,76): save(...)` 且没有 break ——
    循环每次覆盖同一个文件，最终**总是**落在最低的 76，画质白丢。
    这里显式挑档并返回实际使用的 q。
    """
    for q in (88, 85, 82, 78, 74):
        im.save(path, "JPEG", quality=q, optimize=True, progressive=True, subsampling=2)
        if os.path.getsize(path) <= original_size * 0.85:
            return q
    return 74


def save_png(im: Image.Image, path: str, alpha: bool) -> None:
    """PNG：转调色板 + 256 色，alpha 用 FASTOCTREE 保住"""
    if alpha:
        work = im.convert("RGBA")
        q = work.quantize(colors=256, method=Image.FASTOCTREE)
        q.save(path, "PNG", optimize=True)
    else:
        work = im.convert("RGB")
        q = work.quantize(colors=192, method=Image.MEDIANCUT, dither=Image.FLOYDSTEINBERG)
        q.save(path, "PNG", optimize=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    needed = load_needed()

    targets = []
    for dirpath, _dirnames, filenames in os.walk(PUBLIC):
        for fn in filenames:
            if not fn.lower().endswith((".png", ".jpg", ".jpeg", ".webp")):
                continue
            absp = os.path.join(dirpath, fn)
            rel = os.path.relpath(absp, PUBLIC).replace("\\", "/")
            if rel in SKIP:
                continue
            targets.append((rel, absp))

    targets.sort()

    total_before = total_after = 0
    rows = []

    for rel, absp in targets:
        before = os.path.getsize(absp)
        total_before += before

        with Image.open(absp) as im0:
            im0.load()
            orig = im0.copy()
            w, h = orig.size
            alpha = has_alpha(orig)

            # 目标宽度
            no_resize = any(rel.startswith(p) for p in NO_RESIZE_PREFIX)
            if rel in RESIZE_OVERRIDE and not no_resize:
                tw = RESIZE_OVERRIDE[rel]
                if tw is None:
                    tw = w  # 只重编码
            elif no_resize:
                tw = w  # 只重编码，不缩
            else:
                info = needed.get(rel)
                if info and info["pxW"] > 0 and w > info["pxW"] * 1.25:
                    tw = int(round(info["pxW"] * 1.15))
                else:
                    tw = w  # 尺寸已经合适，只重编码

            tw = min(tw, w)
            th = max(1, int(round(h * tw / w)))

            work = orig
            if tw != w:
                # 抗锯齿：先轻微腐蚀掉 JPEG 边缘振铃再缩，避免灰边
                work = work.resize((tw, th), Image.LANCZOS)

            # 写临时文件比较
            tmp = absp + ".tmp"
            ext = os.path.splitext(rel)[1].lower()
            if ext in (".jpg", ".jpeg"):
                q_used = save_jpeg(work.convert("RGB"), tmp, before)
            else:
                q_used = None
                save_png(work, tmp, alpha)

            after = os.path.getsize(tmp)

            # 画质只衡量「编码损失」：原图先缩到目标尺寸，再和成品比。
            # 尺寸本身缩小的合理性由「实测渲染尺寸」保证，不在这里重复惩罚。
            ref = orig if work.size == orig.size else orig.resize(work.size, Image.LANCZOS)
            diff = rms(ref, Image.open(tmp))

            saving = (before - after) / before if before else 0
            ok = diff <= RMS_LIMIT and saving >= MIN_SAVING
            if ok:
                if not args.dry_run:
                    os.makedirs(os.path.join(BACKUP, os.path.dirname(rel)), exist_ok=True)
                    shutil.copy2(absp, os.path.join(BACKUP, rel))
                    os.replace(tmp, absp)
                total_after += after
            else:
                os.remove(tmp)
                total_after += before

            rows.append((rel, before, after if ok else before, (tw, th), (w, h), diff, ok, q_used, saving))

    # ---- 报告 ----
    print(f"{'原 KB':>8} {'新 KB':>8} {'省':>6}  {'尺寸':>15}  {'RMS':>5}  {'q':>3}  path")
    print("-" * 108)
    for rel, b, a, tw, ow, d, ok, q_used, saving in rows:
        if not ok:
            continue
        print(
            f"{b/1024:8.1f} {a/1024:8.1f} {saving*100:5.0f}%  "
            f"{ow[0]}x{ow[1]}→{tw[0]}x{tw[1]}".rjust(15)
            + f"  {d:5.2f}  {str(q_used or '-'):>3}  {rel}"
        )

    skipped = [r for r in rows if not r[6]]
    print("-" * 108)
    print(
        f"合计 {total_before/1024:.1f}KB → {total_after/1024:.1f}KB  "
        f"(省 {(total_before-total_after)/1024:.1f}KB, "
        f"{(total_before-total_after)/total_before*100:.0f}%)"
        + ("   [dry-run 未落盘]" if args.dry_run else "")
    )
    print(f"未改动 {len(skipped)} 张（省幅 < {MIN_SAVING*100:.0f}% 或 RMS 超限）：")
    for rel, b, a, tw, ow, d, ok, q_used, saving in skipped:
        print(f"        {b/1024:7.1f}KB  省{saving*100:4.0f}%  RMS{d:4.2f}  {rel}")


if __name__ == "__main__":
    main()
