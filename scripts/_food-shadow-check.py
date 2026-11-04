"""检查六道菜详情页在 hero 下沿（y=220）有没有出现"阴影被切"的横向台阶。

判据：统计每行「比纯白暗一点」的像素数（x 在中间区域）。阴影若越过 220 被裁，
219 行会有一片灰、220 行直接归零 —— 计数断崖。
"""
import os
from PIL import Image

BASE = os.path.dirname(os.path.abspath(__file__))
S = 2
NAMES = ['沙拉', '奶昔', '三明治', '照烧锅', '拿铁', '酸奶']

for i, nm in enumerate(NAMES):
    p = os.path.join(BASE, f'_food-{i}.png')
    if not os.path.exists(p):
        print(f'{nm}: 缺图')
        continue
    im = Image.open(p).convert('RGB')
    px = im.load()
    W, H = im.size
    counts = {}
    for y in range(214, 226):
        c = 0
        for x in range(60 * S, 330 * S, 2):
            r, g, b = px[x, y * S]
            if r * 0.299 + g * 0.587 + b * 0.114 < 252:
                c += 1
        counts[y] = c
    drop = counts[219] - counts[220]
    flag = 'OK ' if drop < 25 else 'CUT'
    print(f'{flag} {nm:4s}  y218={counts[218]:3d} y219={counts[219]:3d} y220={counts[220]:3d} y221={counts[221]:3d}  断崖={drop:+d}')
