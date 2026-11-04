import os
from PIL import Image, ImageDraw
BASE = os.path.dirname(os.path.abspath(__file__))
S = 2
PICKS = [(0, 'SALAD  +15px'), (2, 'SANDWICH  +22px'), (4, 'LATTE (drink)  unchanged'), (5, 'YOGURT  +8px')]
CLIP = (0, 0, 390 * S, 300 * S)

tiles = []
for idx, label in PICKS:
    im = Image.open(os.path.join(BASE, f'_food-{idx}.png')).convert('RGB').crop(CLIP)
    im = im.resize((im.width // 2, im.height // 2), Image.LANCZOS)
    tiles.append((im, label))

pad, lab_h = 14, 28
cols, rows = 2, 2
tw, th = tiles[0][0].size
W = tw * cols + pad * (cols + 1)
H = (th + lab_h) * rows + pad * (rows + 1)
canvas = Image.new('RGB', (W, H), (240, 240, 240))
d = ImageDraw.Draw(canvas)
for i, (t, label) in enumerate(tiles):
    c, r = i % cols, i // cols
    x = pad + c * (tw + pad)
    y = pad + r * (th + lab_h + pad)
    d.text((x + 4, y + 6), label, fill=(25, 25, 25))
    canvas.paste(t, (x, y + lab_h))
out = os.path.join(BASE, '_food-shift-result.png')
canvas.save(out)
print(out, canvas.size)
