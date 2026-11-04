# -*- coding: utf-8 -*-
"""分析用户给的食材大图：尺寸、背景色、网格布局。"""
from PIL import Image
import numpy as np

SRC = r'C:\Users\kccog\.workbuddy-ai\clipboard-images\clipboard-2026-10-12T15-59-56-944Z-bf8961e7.jpg'

im = Image.open(SRC).convert('RGB')
w, h = im.size
print('尺寸:', im.size, im.mode)

a = np.asarray(im).astype(int)
print('角落像素:')
for name, (y, x) in {
    '左上': (2, 2), '右上': (2, w - 3), '左下': (h - 3, 2), '右下': (h - 3, w - 3),
    '上中': (2, w // 2), '左中': (h // 2, 2),
}.items():
    print(f'  {name}: {tuple(a[y, x])}')

# 背景亮度分布（取四条边各 3px 的带状区域）
edges = np.concatenate([
    a[:3, :, :].reshape(-1, 3), a[-3:, :, :].reshape(-1, 3),
    a[:, :3, :].reshape(-1, 3), a[:, -3:, :].reshape(-1, 3)
])
print(f'边缘亮度 min={edges.min(axis=0)} max={edges.max(axis=0)} mean={edges.mean(axis=0).round(1)}')

# 非白像素（任一分量 < 240）的列/行投影，用来找网格分隔
mask = (a < 235).any(axis=2)
colsum = mask.sum(axis=0)
rowsum = mask.sum(axis=1)

def runs(profile, thresh):
    """找出连续 >= thresh 的区间"""
    out, start = [], None
    for i, v in enumerate(profile):
        if v >= thresh and start is None:
            start = i
        elif v < thresh and start is not None:
            out.append((start, i - 1))
            start = None
    if start is not None:
        out.append((start, len(profile) - 1))
    return out

print('\n内容列区间（宽度>10）:')
for s, e in runs(colsum, 3):
    if e - s > 10:
        print(f'  x {s}–{e}  宽 {e-s+1}')
print('内容行区间（高度>10）:')
for s, e in runs(rowsum, 3):
    if e - s > 10:
        print(f'  y {s}–{e}  高 {e-s+1}')
