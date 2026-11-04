# -*- coding: utf-8 -*-
"""从设计给的 1536x1024 白底图里裁出三枚福利中心图标，导出透明 PNG。
用法：python scripts/split-welfare-icons.py

关键点：
1. 不能「所有近白像素都透明」—— 日历内部那块白纸是**被黑描边围住的**，
   简单阈值会把它挖成洞。所以先对近白做连通域标记，只把**与画布边缘连通**的那一片
   当背景（scipy.ndimage.label），内部白自然保留。
2. **alpha 必须按各自的连通域生成，不能套矩形**。皇冠的 bbox 是 y 504~1009，
   而上面票券/日历的底边一直到 y 514 —— 用矩形裁会把邻居的底边切一条进来。
3. 背景与黑描边之间有一圈 JPEG 抗锯齿灰边，全分辨率下腐蚀 1px 再缩小，
   否则缩小后会在图标外沿留一圈浅灰光晕。
"""
from PIL import Image, ImageFilter
import numpy as np
from scipy import ndimage
import os

SRC = r'C:\Users\OOW\.workbuddy-ai\clipboard-images\clipboard-2026-11-03T17-15-45-943Z-37082536.jpg'
OUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'public', 'welfare-icons')
TARGET_H = 174   # 显示高度 58 CSS × 3（视网膜）
PAD = 6

os.makedirs(OUT_DIR, exist_ok=True)

im = Image.open(SRC).convert('RGB')
rgb = np.asarray(im).astype('uint8')
white = rgb.astype(np.int16).min(axis=2) >= 232

# 背景 = 与画布边缘连通的近白
lbl, _ = ndimage.label(white)
edge = set(lbl[0, :].tolist()) | set(lbl[-1, :].tolist()) | set(lbl[:, 0].tolist()) | set(lbl[:, -1].tolist())
edge.discard(0)
bg = np.isin(lbl, list(edge))

# 前景连通域，取最大的三个
lbl2, n2 = ndimage.label(~bg)
sizes = ndimage.sum(~bg, lbl2, range(1, n2 + 1))
order = np.argsort(sizes)[::-1][:3]

comps = []
for i in order:
    ys, xs = np.nonzero(lbl2 == i + 1)
    comps.append({
        'id': i + 1,
        'box': (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1),
    })

# 命名：最靠下的是皇冠；其余两个按 x 分左右
crown = max(comps, key=lambda c: c['box'][1])
rest = sorted([c for c in comps if c is not crown], key=lambda c: c['box'][0])
ticket, calendar = rest[0], rest[1]

for name, c in (('ic-ticket', ticket), ('ic-calendar', calendar), ('ic-crown', crown)):
    x0, y0, x1, y1 = c['box']
    comp = (lbl2 == c['id'])
    alpha = np.where(comp, 255, 0).astype('uint8')
    img = Image.fromarray(np.dstack([rgb, alpha]), 'RGBA')
    # 腐蚀 alpha 1px：去掉背景抗锯齿留下的浅边
    img.putalpha(img.getchannel('A').filter(ImageFilter.MinFilter(3)))
    crop = img.crop((max(0, x0 - PAD), max(0, y0 - PAD), min(im.width, x1 + PAD), min(im.height, y1 + PAD)))
    h = TARGET_H
    w = round(crop.width * h / crop.height)
    small = crop.resize((w, h), Image.LANCZOS)
    # 量化到 200 色（FASTOCTREE 保 alpha）：39KB → 6KB，六张对比图看不出差别，
    # 但能守住 public 目录的瘦身成果（见 2026-10-29 那次 13MB→2.6MB）
    small = small.quantize(colors=200, method=Image.FASTOCTREE)
    out = os.path.join(OUT_DIR, name + '.png')
    small.save(out, optimize=True)
    print('%-14s %4d×%4d -> %3d×%3d  %5.1f KB' % (name, crop.width, crop.height, w, h, os.path.getsize(out) / 1024))
