# -*- coding: utf-8 -*-
"""量 4 张入口卡里插画内容（非白像素）距离卡片四边的余量，判断有没有被 overflow-hidden 裁掉。
用法：python scripts/measure-home-cards-render.py
"""
from PIL import Image

im = Image.open('outputs/home-ref/home-after.png').convert('RGB')
px = im.load()
S = 2                      # deviceScaleFactor
OX = 5                     # 手机壳在视口里的 x 偏移

# 卡片在「壳内」的坐标（px），由 shot-home-ref.mjs 的实测值推得
CARDS = {
    '外卖配送': (10, 316, 202, 441),
    '到店自取': (208, 316, 400, 441),
    '福利中心': (10, 449, 202, 574),
    '今日抽卡': (208, 449, 400, 574),
}


def is_white(c):
    r, g, b = c
    return r > 246 and g > 246 and b > 246


for name, (x0, y0, x1, y1) in CARDS.items():
    # 转截图坐标；向内收 3px 避开卡片的浅灰描边与圆角
    sx0, sy0 = int((OX + x0) * S) + 5, int(y0 * S) + 5
    sx1, sy1 = int((OX + x1) * S) - 5, int(y1 * S) - 5
    minx, miny, maxx, maxy = 10 ** 9, 10 ** 9, -1, -1
    for y in range(sy0, sy1):
        for x in range(sx0, sx1):
            if not is_white(px[x, y]):
                if x < minx: minx = x
                if x > maxx: maxx = x
                if y < miny: miny = y
                if y > maxy: maxy = y
    if maxx < 0:
        print(f'{name}: 没找到内容'); continue
    print(
        f'{name}: 内容距卡边 上{(miny-sy0)/S:5.1f} 下{(sy1-maxy)/S:5.1f} '
        f'左{(minx-sx0)/S:5.1f} 右{(sx1-maxx)/S:5.1f}  (px)'
        + ('   ← 下沿贴边，可能被裁' if (sy1 - maxy) / S < 3 else '')
    )
