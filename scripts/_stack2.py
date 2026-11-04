# -*- coding: utf-8 -*-
"""上下拼接两张截图，并在左上角标注 BEFORE / AFTER。"""
import sys
from PIL import Image, ImageDraw

a_path, b_path, out = sys.argv[1], sys.argv[2], sys.argv[3]
a = Image.open(a_path).convert('RGB')
b = Image.open(b_path).convert('RGB')
W = max(a.width, b.width)
GAP, PAD = 14, 6
canvas = Image.new('RGB', (W, a.height + GAP + b.height + PAD * 2), (255, 255, 255))
canvas.paste(a, (0, PAD))
canvas.paste(b, (0, PAD + a.height + GAP))
d = ImageDraw.Draw(canvas)
d.text((8, 2), 'BEFORE', fill=(200, 30, 30))
d.text((8, PAD + a.height + GAP + 2), 'AFTER', fill=(20, 130, 20))
canvas.save(out)
print('saved', out, canvas.size)
