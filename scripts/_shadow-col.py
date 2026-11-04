"""沿杯子中轴取一列像素，看阴影从杯底往下衰减到哪一行才回到纯白。

只取中轴，不会被左右大片白区稀释（之前用全区均值，标准份看着"干净"其实是被稀释了）。
"""
import os
from PIL import Image

BASE = os.path.dirname(os.path.abspath(__file__))
S = 2


def col(name, cx=195):
    p = os.path.join(BASE, name)
    im = Image.open(p).convert('RGB')
    px = im.load()
    print(f'--- {name}  x={cx} ---')
    prev = None
    for y in range(196, 232):
        r, g, b = px[cx * S, y * S]
        lum = r * 0.299 + g * 0.587 + b * 0.114
        mark = ''
        if y == 220:
            mark = '   <-- hero 下沿（裁剪线）'
        print(f'  y={y}  lum={lum:6.1f}{mark}')
        prev = lum


for f in ('_shadow-standard.png', '_shadow-large.png'):
    col(f)
    print()
