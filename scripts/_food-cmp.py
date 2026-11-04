import os
from PIL import Image, ImageDraw

BASE = os.path.dirname(os.path.abspath(__file__))
S = 2
# (文件名索引, 标签)
PICKS = [(0, '沙拉  +15px'), (2, '三明治  +22px'), (4, '拿铁(饮料)  不动'), (5, '酸奶  +8px')]
CLIP = (0, 0, 390 * S, 150 * S)   # 只取 hero 上部，够看食物落点

tiles = []
for idx, label in PICKS:
    im = Image.open(os.path.join(BASE, f'_food-{idx}.png')).convert('RGB')
    tiles.append((im.crop(CLIP), label))

pad, lab_h = 12, 30
W = sum(t.width for t, _ in tiles) + pad * (len(tiles) + 1)
H = max(t.height for t, _ in tiles) + lab_h + pad * 2
canvas = Image.new('RGB', (W, H), (245, 245, 245))
d = ImageDraw.Draw(canvas)
x = pad
for t, label in tiles:
    canvas.paste(t, (x, lab_h + pad))
    d.text((x + 4, 10), label, fill=(30, 30, 30))
    x += t.width + pad
out = os.path.join(BASE, '_food-shift-result.png')
canvas.save(out)
print(out, canvas.size)
