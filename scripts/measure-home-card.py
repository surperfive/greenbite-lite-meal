# -*- coding: utf-8 -*-
"""量参考图「外卖配送」卡片的内部构成：标题 / 副标题 / 插画 各自的高度与占比。
卡片真实 px：x 8.4-184.6, y 291.3-405.3（外框）；内部为青柠底 + 深色文字 + 彩色插画。
用法：python scripts/measure-home-card.py
"""
from PIL import Image

SRC = r'C:\Users\kccog\.workbuddy-ai\clipboard-images\clipboard-2026-10-13T08-17-52-178Z-806455ce.jpg'
im = Image.open(SRC).convert('RGB')
px = im.load()
S = 941 / 375.0

# 卡片内部区域（真实 px），避开 2px 黑框
X0, Y0, X1, Y1 = 12.0, 296.0, 181.0, 402.0
x0, y0, x1, y1 = int(X0 * S), int(Y0 * S), int(X1 * S), int(Y1 * S)

print(f'卡片外框 176.2 x 114.0 真实px；内区 {X1-X0:.1f} x {Y1-Y0:.1f}')


def cls(c):
    r, g, b = c
    if g > 190 and r > 150 and b < 130 and g - b > 90:
        return 'lime'          # 卡底
    if r > 238 and g > 238 and b > 238:
        return 'white'         # 白色字/描边
    if r < 90 and g < 90 and b < 90:
        return 'dark'          # 黑字/黑线
    return 'art'               # 彩色插画


print('\n逐行内容占比（内区范围内）：')
print(f'{"真实y":>7} {"lime%":>6} {"dark%":>6} {"art%":>6} {"white%":>7}')
rows = []
for y in range(y0, y1):
    cnt = {'lime': 0, 'dark': 0, 'art': 0, 'white': 0}
    for x in range(x0, x1):
        cnt[cls(px[x, y])] += 1
    tot = sum(cnt.values())
    rows.append((y / S, {k: 100 * v / tot for k, v in cnt.items()}))

# 只打印有内容变化的行（每 2 真实 px 一行）
for ry, pct in rows[::5]:
    print(f'{ry:7.1f} {pct["lime"]:6.0f} {pct["dark"]:6.0f} {pct["art"]:6.0f} {pct["white"]:7.0f}')

# 汇总：把内区按行分成「标题 / 副标题 / 插画」三段，并给出插画的 bounding box
print('\n=== 分段（按内容判定） ===')
seg = []
for ry, pct in rows:
    ink = pct['dark'] + pct['art']
    seg.append((ry, ink))
# 连续无内容的行作为分隔
gaps = []
run = None
for ry, ink in seg:
    if ink < 1.5:
        if run is None:
            run = [ry, ry]
        else:
            run[1] = ry
    else:
        if run:
            gaps.append(tuple(run))
            run = None
if run:
    gaps.append(tuple(run))
print('空白带（真实 y）：', [(round(a, 1), round(b, 1)) for a, b in gaps if b - a >= 1])

# 插画 bbox：内区里 art 类像素的包围盒
ax0, ay0, ax1, ay1 = 10 ** 9, 10 ** 9, -1, -1
for y in range(y0, y1):
    for x in range(x0, x1):
        if cls(px[x, y]) == 'art':
            ax0 = min(ax0, x); ax1 = max(ax1, x)
            ay0 = min(ay0, y); ay1 = max(ay1, y)
print(f'插画(彩色像素) bbox 真实px: x {ax0/S:.1f}-{ax1/S:.1f} (宽 {(ax1-ax0)/S:.1f}) '
      f'y {ay0/S:.1f}-{ay1/S:.1f} (高 {(ay1-ay0)/S:.1f})')
print(f'  → 占卡片内区宽 {100*(ax1-ax0)/S/(X1-X0):.0f}%  占卡片外框高 {100*(ay1-ay0)/S/114:.0f}%')

