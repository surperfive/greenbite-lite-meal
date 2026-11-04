"""把用户给的「大份」六宫格照片切成六张透明底抠图。

源图 1376x768，3 列 x 2 行，纯白背景 + 轻微接触投影。
做法：每格按实测内容 bbox 裁切 -> cv2 GrabCut 抠前景 -> 去小连通块 -> 轻微羽化
      -> 按 alpha bbox 收紧 -> 补成正方形（留 6% 边距）-> 560x560 PNG。

输出：public/dishes/large/dish-*.png
"""
import os
import numpy as np
import cv2
from PIL import Image

SRC = r'C:\Users\OOW\.workbuddy\clipboard-images\clipboard-2026-10-22T16-49-36-562Z-d869e716.jpg'
OUT = r'C:\Users\OOW\Downloads\qing (2)\public\dishes\large'
os.makedirs(OUT, exist_ok=True)

# 每格里菜品的实测内容 bbox（x0, y0, x1, y1），来自非白像素扫描
CELLS = [
    ('dish-avocado-chicken-salad', (80, 71, 425, 340)),
    ('dish-tuna-sandwich',         (543, 54, 900, 340)),
    ('dish-kale-smoothie',         (1054, 12, 1265, 362)),
    ('dish-teriyaki-pot',          (65, 412, 430, 705)),
    ('dish-coldbrew-latte',        (540, 428, 916, 733)),
    ('dish-greek-yogurt',          (1002, 397, 1305, 694)),
]

PAD = 16  # 裁切外扩，给 GrabCut 留边界

img = cv2.imread(SRC, cv2.IMREAD_COLOR)
H, W = img.shape[:2]

for name, (x0, y0, x1, y1) in CELLS:
    # 限制在本格范围内，避免把邻格的菜带进来
    cx = (x0 + x1) // 2
    cy = (y0 + y1) // 2
    gx0, gx1 = (cx // (W // 3)) * (W // 3), ((cx // (W // 3)) + 1) * (W // 3)
    gy0, gy1 = (cy // (H // 2)) * (H // 2), ((cy // (H // 2)) + 1) * (H // 2)
    ax0, ay0 = max(gx0, x0 - PAD), max(gy0, y0 - PAD)
    ax1, ay1 = min(gx1, x1 + PAD), min(gy1, y1 + PAD)
    crop = img[ay0:ay1, ax0:ax1].copy()
    ch, cw = crop.shape[:2]

    # --- GrabCut：矩形初始化，矩形内全部当作"可能是前景" ---
    mask = np.zeros((ch, cw), np.uint8)
    bgd, fgd = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
    rect = (2, 2, cw - 4, ch - 4)
    cv2.grabCut(crop, mask, rect, bgd, fgd, 6, cv2.GC_INIT_WITH_RECT)
    fg = np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)

    # --- 去掉零散小块，只留最大的主体 ---
    n, lab, stats, _ = cv2.connectedComponentsWithStats(fg, 8)
    if n > 1:
        idx = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
        fg = np.where(lab == idx, 255, 0).astype(np.uint8)

    # --- 闭运算补内部空洞 ---
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    fg = cv2.morphologyEx(fg, cv2.MORPH_CLOSE, k, iterations=2)

    # --- 羽化 1px：先腐蚀 1px 再高斯模糊，去掉 GrabCut 硬边 ---
    fg = cv2.erode(fg, np.ones((3, 3), np.uint8), iterations=1)
    alpha = cv2.GaussianBlur(fg, (3, 3), 0.7)

    # --- 去白边（抠白底图最丑的一环）---
    # 背景是纯白，抗锯齿过渡带在 GrabCut 里会被判成"实心前景"，于是碗沿留一圈白。
    # 三步处理：
    #   1) 算每个像素到透明区的距离，距边 ≤3px 的算“边缘带”
    #   2) 以“离边 >3px 的实心像素”为种子，把颜色一圈圈往外推，得到一份干净的前景色
    #   3) 边缘带里凡是接近白的像素，颜色换成推出来的前景色、alpha 按白度打折
    rgb = cv2.cvtColor(crop, cv2.COLOR_BGR2RGB).astype(np.float32)
    dist = cv2.distanceTransform((alpha < 8).astype(np.uint8), cv2.DIST_L2, 5)

    seed = ((alpha > 250) & (dist > 3.5)).astype(np.float32)
    m = seed.copy()
    col = rgb.copy()
    for _ in range(8):
        w = m[..., None]
        num = cv2.boxFilter(col * w, -1, (3, 3), normalize=False)
        den = cv2.boxFilter(w, -1, (3, 3), normalize=False)
        fill = num / np.maximum(den, 1e-6)[..., None]
        newly = (den > 0.001) & (m < 0.999)
        col = np.where(newly[..., None], fill, col)
        m = np.where(den > 0.001, np.float32(1.0), m)

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

    # --- 收紧到 alpha bbox ---
    bb = im.split()[3].getbbox()
    im = im.crop(bb)
    w, h = im.size

    # --- 补成正方形，边距 6% ---
    side = int(max(w, h) * 1.12)
    canvas = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    canvas.paste(im, ((side - w) // 2, (side - h) // 2), im)
    canvas = canvas.resize((560, 560), Image.LANCZOS)

    path = os.path.join(OUT, name + '.png')
    canvas.save(path)
    print(f'{name:32s} cell {cw}x{ch}  content {w}x{h}  -> {path}')
