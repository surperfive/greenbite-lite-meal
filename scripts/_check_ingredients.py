# -*- coding: utf-8 -*-
"""拼一张 contact sheet 检查抠图质量：浅灰底，能同时看出透明区和残留白边。"""
import os

from PIL import Image

D = 'public/ingredients'
IDS = ['ing_steak', 'ing_prawn', 'ing_chicken', 'ing_tofu', 'ing_egg',
       'ing_quinoa', 'ing_kale', 'ing_tomato', 'ing_broccoli', 'ing_edamame']

CELL = 210
BG = (226, 232, 240)
os.makedirs('probe-out', exist_ok=True)

sheet = Image.new('RGB', (CELL * 5, CELL * 2), BG)
for i, name in enumerate(IDS):
    p = f'{D}/{name}.png'
    im = Image.open(p).convert('RGBA')
    # 统计透明像素占比
    alpha = im.split()[3]
    hist = alpha.histogram()
    transparent = hist[0] / (im.size[0] * im.size[1])
    im.thumbnail((CELL - 24, CELL - 24), Image.LANCZOS)
    cx, cy = (i % 5) * CELL, (i // 5) * CELL
    sheet.paste(im, (cx + (CELL - im.size[0]) // 2, cy + (CELL - im.size[1]) // 2), im)
    print(f'{name:<14} {im.size[0]}x{im.size[1]:<4} 透明像素 {transparent*100:5.1f}%  {os.path.getsize(p)/1024:6.1f} KB')

sheet.save('probe-out/ingredients-sheet.png')
print('\n→ probe-out/ingredients-sheet.png')
