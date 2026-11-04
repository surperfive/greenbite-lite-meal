"""检测 hero 底边（y=220 CSS / 440 设备像素）有没有把食物阴影硬切掉。

判据：如果有阴影越过 hero 下沿被 overflow-hidden 裁掉，
那么 y=219 那几行会残留一圈灰，而 y=221 紧接着是纯白 —— 形成一个横向的亮度台阶。
"""
import os
from PIL import Image

BASE = os.path.dirname(os.path.abspath(__file__))
S = 2  # devicePixelRatio


def scan(name):
    p = os.path.join(BASE, name)
    if not os.path.exists(p):
        print(f'{name}: 缺失')
        return None
    im = Image.open(p).convert('RGB')
    W, H = im.size
    px = im.load()
    y_edge = 220 * S

    rows = {}
    for dy in range(-8, 9):
        y = min(H - 1, max(0, y_edge + dy))
        vals = []
        for x in range(120 * S, 270 * S):
            r, g, b = px[x, y]
            vals.append(r * 0.299 + g * 0.587 + b * 0.114)
        rows[dy] = sum(vals) / len(vals)

    # 台阶：hero 下沿上下各 3 行均值的差
    above = sum(rows[d] for d in (-4, -3, -2)) / 3
    below = sum(rows[d] for d in (2, 3, 4)) / 3
    step = above - below
    print(f'{name}: 上沿均值={above:.1f} 下沿均值={below:.1f} 台阶={step:+.2f}')
    for d in sorted(rows):
        print(f'   y={220 + d:>4}  {rows[d]:.1f}')
    return step


for f in ('_shadow-standard.png', '_shadow-large.png'):
    scan(f)
    print()
