import os
from PIL import Image, ImageDraw

BASE = os.path.dirname(os.path.abspath(__file__))
b = Image.open(os.path.join(BASE, '_shadow-before-shot.png')).convert('RGB')
a = Image.open(os.path.join(BASE, '_shadow-after-shot.png')).convert('RGB')

scale = 1.6
b = b.resize((int(b.width * scale), int(b.height * scale)), Image.LANCZOS)
a = a.resize((int(a.width * scale), int(a.height * scale)), Image.LANCZOS)

pad, lab = 14, 40
W = b.width + a.width + pad * 3
H = b.height + lab + pad * 2
canvas = Image.new('RGB', (W, H), (255, 255, 255))
d = ImageDraw.Draw(canvas)
canvas.paste(b, (pad, lab + pad))
canvas.paste(a, (pad * 2 + b.width, lab + pad))
d.text((pad + 6, 12), 'BEFORE: 0 5px 8px .20 + 0 14px 26px .16  ->  tail cut off at hero edge', fill=(190, 40, 40))
d.text((pad * 2 + b.width + 6, 12), 'AFTER: 0 2px 4px .30 + 0 4px 5px .14  ->  ends inside hero', fill=(25, 120, 45))
out = os.path.join(BASE, '_shadow-before-after.png')
canvas.save(out)
print(out, canvas.size)
