# -*- coding: utf-8 -*-
"""按「整行/整列的色彩占比」找参考图的版面分带。
页面底 = 近白；卡片 = 青柠(#CFF92D 附近) 或 近白。
用法：python scripts/measure-home-ref2.py
"""
from PIL import Image

path = r'C:\Users\kccog\.workbuddy-ai\clipboard-images\clipboard-2026-10-13T08-17-52-178Z-806455ce.jpg'
im = Image.open(path).convert('RGB')
W, H = im.size
px = im.load()
print(f'图片 {W} x {H}  aspect(宽/高)={W/H:.3f}   推定设备 375x667 -> 缩放 {W/375:.3f}')


def kind(c):
    r, g, b = c
    if g > 200 and r > 160 and b < 120:
        return 'lime'
    if r > 240 and g > 240 and b > 240:
        return 'white'
    if r < 60 and g < 60 and b < 60:
        return 'black'
    return 'other'


def scan_rows():
    print('\n=== 逐行主导色（每 4px 采样） ===')
    out = []
    for y in range(0, H, 2):
        cnt = {'lime': 0, 'white': 0, 'black': 0, 'other': 0}
        for x in range(0, W, 4):
            cnt[kind(px[x, y])] += 1
        tot = sum(cnt.values())
        dom = max(cnt, key=cnt.get)
        out.append((y, dom, {k: round(100 * v / tot) for k, v in cnt.items()}))
    # 压缩成连续段
    segs = []
    prev = None
    start = 0
    for y, dom, pct in out:
        if dom != prev:
            if prev is not None and y - start >= 8:
                segs.append((start, y - 2, prev))
            prev = dom
            start = y
    segs.append((start, H - 1, prev))
    for a, b, d in segs:
        print(f'  y {a:4d}-{b:4d}  高 {b-a+1:4d} ({100*(b-a+1)/H:5.1f}%)  主导 {d}')


def scan_cols(y0, y1, label):
    print(f'\n=== {label}：y {y0}-{y1} 逐列主导色 ===')
    segs = []
    prev = None
    start = 0
    for x in range(W):
        cnt = {'lime': 0, 'white': 0, 'black': 0, 'other': 0}
        for y in range(y0, y1, 2):
            cnt[kind(px[x, y])] += 1
        tot = sum(cnt.values())
        dom = max(cnt, key=cnt.get)
        if dom != prev:
            if prev is not None and x - start >= 6:
                segs.append((start, x - 1, prev))
            prev = dom
            start = x
    segs.append((start, W - 1, prev))
    for a, b, d in segs:
        print(f'  x {a:4d}-{b:4d}  宽 {b-a+1:4d} ({100*(b-a+1)/W:5.1f}%)  主导 {d}')


scan_rows()
