# -*- coding: utf-8 -*-
"""用连通域把参考图里的「青柠色卡片」抠出来，量它们的真实 bounding box。
页面底 = 白；卡片 = 青柠 + 黑描边（描边会把各卡片天然分开，不需要形态学）。
用法：python scripts/label-home-ref.py
"""
from collections import deque
from PIL import Image

SRC = r'C:\Users\kccog\.workbuddy-ai\clipboard-images\clipboard-2026-10-13T08-17-52-178Z-806455ce.jpg'
im = Image.open(SRC).convert('RGB')
W, H = im.size
S = 941 / 375.0                       # 图 px -> 真实设备 px
DS = 2                                # 降采样倍数，加速
w, h = W // DS, H // DS
small = im.resize((w, h), Image.NEAREST)
px = small.load()


def is_lime(c):
    r, g, b = c
    # 参考图青柠实测约 (207,249,45)，允许一定范围
    return g > 190 and r > 150 and b < 130 and g - b > 90


mask = [[is_lime(px[x, y]) for x in range(w)] for y in range(h)]
seen = [[False] * w for _ in range(h)]
boxes = []

for y0 in range(h):
    for x0 in range(w):
        if not mask[y0][x0] or seen[y0][x0]:
            continue
        q = deque([(x0, y0)])
        seen[y0][x0] = True
        minx = maxx = x0
        miny = maxy = y0
        n = 0
        while q:
            x, y = q.popleft()
            n += 1
            if x < minx: minx = x
            if x > maxx: maxx = x
            if y < miny: miny = y
            if y > maxy: maxy = y
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < w and 0 <= ny < h and mask[ny][nx] and not seen[ny][nx]:
                    seen[ny][nx] = True
                    q.append((nx, ny))
        if n > 400:                   # 过滤噪点
            boxes.append((n, minx * DS, miny * DS, maxx * DS, maxy * DS))

boxes.sort(key=lambda b: -b[0])
print(f'图 {W}x{H}  缩放 {S:.3f}  真实设备宽 375')
print(f'{"面积":>9} {"原图 box (x0,y0,x1,y1)":>30} {"真实 px (x,y,w,h)":>26} {"占宽%":>7} {"占高%":>7}')
for n, x0, y0, x1, y1 in boxes[:14]:
    rw, rh = (x1 - x0) / S, (y1 - y0) / S
    rx, ry = x0 / S, y0 / S
    print(f'{n:9d} ({x0:4d},{y0:4d},{x1:4d},{y1:4d})   '
          f'({rx:6.1f},{ry:6.1f},{rw:6.1f},{rh:6.1f})  {100*rw/375:6.1f}% {100*rh/666:6.1f}%')
