# -*- coding: utf-8 -*-
"""量参考图（首页截图）里各组件的位置与比例。
输出：图片尺寸、页面左右边距、2x2 卡片网格的行列边界、各横向 banner 的上下边界。
用法：python scripts/measure-home-ref.py <图片路径>
"""
import sys
from PIL import Image

path = sys.argv[1] if len(sys.argv) > 1 else r'C:\Users\kccog\.workbuddy-ai\clipboard-images\clipboard-2026-10-13T08-17-52-178Z-806455ce.jpg'
im = Image.open(path).convert('RGB')
W, H = im.size
px = im.load()
print(f'图片尺寸 {W} x {H}   宽高比 {W/H:.3f}')


def near(c, ref, tol=26):
    return all(abs(c[i] - ref[i]) <= tol for i in range(3))


def rowcolor(y, x0=0, x1=None):
    """该行中点区域的主色"""
    x1 = x1 or W
    from collections import Counter
    cnt = Counter()
    for x in range(x0, x1, 3):
        cnt[px[x, y]] += 1
    return cnt.most_common(1)[0][0]


# 1) 竖直扫描：在左侧卡片列的中轴找「非页面底色」的连续段
X = int(W * 0.08)   # 左卡片内部
print(f'\n竖直扫描 x={X}（左列卡片内）逐段：')
segs = []
prev = None
start = 0
for y in range(H):
    c = px[X, y]
    key = (c[0] // 28, c[1] // 28, c[2] // 28)   # 粗量化
    if key != prev:
        if prev is not None and y - start > 8:
            segs.append((start, y - 1, px[X, (start + y) // 2]))
        prev = key
        start = y
segs.append((start, H - 1, px[X, (start + H) // 2]))
for a, b, c in segs:
    print(f'  y {a:4d} - {b:4d}  高 {b-a+1:4d}  ({100*(b-a+1)/H:5.1f}% of H)  色 {c}')

# 2) 水平扫描：穿过 2x2 网格第一行，找卡片左右边界
Y = None
for a, b, c in segs:
    if b - a > 60 and c[1] > 180 and c[0] > 150:   # 青柠底
        Y = (a + b) // 2
        break
print(f'\n水平扫描 y={Y}（第一行卡片中轴）：')
if Y:
    runs = []
    prev = None
    start = 0
    for x in range(W):
        c = px[x, Y]
        key = (c[0] // 28, c[1] // 28, c[2] // 28)
        if key != prev:
            if prev is not None and x - start > 6:
                runs.append((start, x - 1, px[(start + x) // 2, Y]))
            prev = key
            start = x
    runs.append((start, W - 1, px[(start + W) // 2, Y]))
    for a, b, c in runs:
        print(f'  x {a:4d} - {b:4d}  宽 {b-a+1:4d}  ({100*(b-a+1)/W:5.1f}% of W)  色 {c}')

# 3) 关键参考色采样
print('\n关键点采样：')
pts = {
    '页面底色(卡片间隙)': (int(W*0.5), int(H*0.60)),
    '卡片内部': (int(W*0.15), int(H*0.50)),
    '顶部黑条': (int(W*0.5), 10),
}
for k, (x, y) in pts.items():
    print(f'  {k} @({x},{y}) = {px[x,y]}')
