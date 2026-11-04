"""把 alpha 包围盒换算成「食物内容底边落在页面的第几 px」，用来对比六道菜的位置差。

口径（390 宽视口，节流过）：
  hero 220 高，食物层 pt-6 pb-2 → 185 盒子 top ≈ 25.5
  内容底 = 25.5 + 185 × bottomFrac
"""
import glob
import os
from PIL import Image

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DRINKS = {'dish-coldbrew-latte.png', 'dish-kale-smoothie.png'}
BOX_TOP = 25.5
BOX = 185

for stage in ('standard', 'large'):
    print(f'== {stage}')
    for p in sorted(glob.glob(os.path.join(BASE, 'public', 'dishes', stage, '*.png'))):
        name = os.path.basename(p)
        im = Image.open(p)
        bb = im.split()[3].getbbox()
        frac = bb[3] / im.size[1]
        bottom = BOX_TOP + BOX * frac
        kind = 'drink' if name in DRINKS else 'food '
        print(f'  {name:28s} {kind}  bottom={bottom:6.1f}px')
