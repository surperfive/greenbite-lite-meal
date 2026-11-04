# -*- coding: utf-8 -*-
"""在参考图的若干竖直采样线上，输出「非页面底色」的连续段 = 各组件在竖直方向的边界。
页面底色 = 近白。用法：python scripts/bands-home-ref.py
"""
from PIL import Image

SRC = r'C:\Users\kccog\.workbuddy-ai\clipboard-images\clipboard-2026-10-13T08-17-52-178Z-806455ce.jpg'
im = Image.open(SRC).convert('RGB')
W, H = im.size
S = 941 / 375.0
px = im.load()


def is_bg(c):
    r, g, b = c
    return r > 238 and g > 238 and b > 238


def runs_at(x, minlen=10):
    out = []
    y = 0
    while y < H:
        if not is_bg(px[x, y]):
            y0 = y
            while y < H and not is_bg(px[x, y]):
                y += 1
            if y - y0 >= minlen:
                out.append((y0, y - 1))
        y += 1
    return out


for x in [8, 188, 470, 930]:
    print(f'\n=== 采样线 x={x} (real {x/S:.0f}) ===')
    for a, b in runs_at(x):
        print(f'  real y {a/S:6.1f} - {b/S:6.1f}   高 {(b-a+1)/S:6.1f}')
