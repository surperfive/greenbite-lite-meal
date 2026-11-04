"""
修掉抠图 cutout 的白边（matte fringe）—— v2，两步走。

**问题**：`split-dish-photos.py` 导出的 alpha 是二值（0/255），随后 `resize(LANCZOS)`
+ `GaussianBlur` 才把边缘变成半透明。但 RGB 通道没做预乘，缩放时**白背景的 RGB
被混进边缘像素**，于是半透明边缘的亮度被拉高 —— 放在彩色色块上就是一圈白边
（实测边缘亮度比内部高 76~103，肉眼看就是"没扣干净"）。

**修法（三步）**：
  ① 反预乘：`C_true = (C_obs − (1−α)·255) / α`，把混进去的白减掉。
     单做这一步能把 Δ 从 +76~103 压到 +15~34，但边缘仍偏亮（α 小的位置除法噪声大）。
  ② 边缘色渗（edge color bleed）：把半透明像素的 RGB **直接换成最近的"实心"像素色**。
     缩放/模糊只会沿 alpha 做插值，颜色本身来自主体内部，边缘就不会再泛白。
     这一步是彻底解决白边的关键，① 只是让 ② 的输入更接近真值。
  ③ 玻璃杯壁透明化（只对 `GLASS_WALL` 白名单）：**玻璃杯**的杯壁/杯底在原图里是
     "背景透过来的一片白"，抠图后成了不透明的白，压在品类色块上就是一圈白边/白块，
     看起来像"没扣干净"。判据是「亮 + 不透明 + 贴着轮廓（dist<18）」，把它的 alpha
     降到 0.4~0.45，让色块透上来 —— 这才是玻璃杯在彩色底上的正确表现。
     ⚠️ **不能对所有菜做**：陶瓷碗（沙拉/酸奶）、面包（三明治）的白是主体材质，
     降 alpha 会让它们变半透明。只有玻璃杯适用，所以用白名单而不是自动判据。

用法：
  python scripts/fix-cutout-fringe.py            # 修 public/dishes/cutout/*.png
  python scripts/fix-cutout-fringe.py --dry-run  # 只报告，不写文件
  python scripts/fix-cutout-fringe.py --restore  # 从备份还原（回到未修状态）
⚠️ 原始文件备份在 scripts/assets/cutout-backup/（不在 public 下，避免进 dist），脚本**永远从备份读**，
   所以可以反复重跑而不会叠加处理（幂等）。
"""
import glob
import os
import shutil
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

CUTOUT_DIR = 'public/dishes/cutout'
BACKUP_DIR = 'scripts/assets/cutout-backup'   # ⚠️ 不要放在 public/ 下，否则会被打进 dist
BG = 255.0            # 抠图时的背景是纯白
ALPHA_FLOOR = 0.05    # 低于这个 alpha 的边缘像素直接归零（去掉一圈白雾）
SOLID = 0.92          # α ≥ 这个值算"实心"，作为色渗的取样源
# ③ 玻璃杯白名单：文件名 → alpha 保留系数（越小越透）
#   拿铁杯身大半是透明玻璃，白最扎眼（0.40）；奶昔杯身被深绿填满，只有杯口/杯底
#   一圈玻璃，压太多会让杯口"消失"，所以留 0.45。
GLASS_WALL = {
    'dish-coldbrew-latte.png': 0.40,
    'dish-kale-smoothie.png': 0.45,
}
GLASS_LUM = 205       # ③ 判据：亮度 > 205
GLASS_DIST = 18       # ③ 判据：距透明区 < 18px（贴轮廓的带 = 杯壁，不是杯内高光）

dry = '--dry-run' in sys.argv
restore = '--restore' in sys.argv

files = sorted(glob.glob(os.path.join(CUTOUT_DIR, '*.png')))
if not files:
    sys.exit(f'没找到 cutout：{CUTOUT_DIR}')

os.makedirs(BACKUP_DIR, exist_ok=True)

if restore:
    n = 0
    for path in files:
        bak = os.path.join(BACKUP_DIR, os.path.basename(path))
        if os.path.exists(bak):
            shutil.copy2(bak, path)
            n += 1
    sys.exit(f'已从备份还原 {n} 个文件')

for path in files:
    name = os.path.basename(path)
    bak = os.path.join(BACKUP_DIR, name)
    # 第一次运行时把当前文件存成备份；之后一律从备份读，保证幂等
    if not os.path.exists(bak):
        shutil.copy2(path, bak)
    im = Image.open(bak).convert('RGBA')
    arr = np.asarray(im).astype(np.float64)
    rgb, alpha = arr[:, :, :3].copy(), arr[:, :, 3].copy()

    a = alpha / 255.0
    semi = (a > 0) & (a < 1)
    before = rgb.mean(axis=2)[semi].mean() if semi.sum() else 0.0

    # ① 反预乘（只动半透明像素）
    safe_a = np.clip(a, 1e-3, 1.0)[..., None]
    corrected = np.clip((rgb - (1.0 - safe_a) * BG) / safe_a, 0, 255)
    rgb = np.where(semi[..., None], corrected, rgb)

    # ② 边缘色渗：半透明像素的 RGB 取最近的实心像素色
    solid = a >= SOLID
    if solid.any() and semi.any():
        # 到最近实心像素的索引（对"非实心"位置求最近实心点）
        _, (iy, ix) = ndimage.distance_transform_edt(~solid, return_indices=True)
        rgb = np.where(semi[..., None], rgb[iy, ix], rgb)

    # 极淡边缘归零，去掉"白雾"那层
    alpha = np.where(a < ALPHA_FLOOR, 0.0, alpha)

    # ③ 玻璃杯壁透明化（白名单）
    glass_k = GLASS_WALL.get(name)
    glass_n = 0
    if glass_k is not None:
        lum = rgb.mean(axis=2)
        dist = ndimage.distance_transform_edt(alpha > 20)
        wall = (lum > GLASS_LUM) & (alpha > 200) & (dist < GLASS_DIST)
        glass_n = int(wall.sum())
        alpha = np.where(wall, alpha * glass_k, alpha)

    after = rgb.mean(axis=2)[semi].mean() if semi.sum() else 0.0
    out = np.dstack([rgb, alpha]).round().clip(0, 255).astype(np.uint8)
    result = Image.fromarray(out, 'RGBA')

    # 边缘 vs 实心的亮度差（修好的标志：应接近 0，不再是 +80 那种）
    lum = rgb.mean(axis=2)
    edge_mask = (alpha / 255.0 > 0.15) & (alpha / 255.0 < 0.85)
    inner_mask = alpha >= 250
    delta = lum[edge_mask].mean() - lum[inner_mask].mean() if edge_mask.any() else 0

    print(
        f'{name:32s} 半透明 {int(semi.sum()):5d}  边缘亮度 {before:6.1f} → {after:6.1f}'
        f'  边缘−内部 {delta:+6.1f}' + (f'  玻璃壁 {glass_n:4d}px ×{glass_k}' if glass_k else '')
    )

    if not dry:
        result.save(path, optimize=True)

print('\n完成（dry-run，未写文件）' if dry else f'\n完成，原始文件备份在 {BACKUP_DIR}')
