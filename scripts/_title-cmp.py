from PIL import Image, ImageDraw
import os

base = os.path.dirname(os.path.abspath(__file__))
b = Image.open(os.path.join(base, '_title-before.png'))
a = Image.open(os.path.join(base, '_title-after.png'))

# 只看顶部区域（设备像素 2x）
box = (0, 260, b.width, 580)
bc = b.crop(box)
ac = a.crop(box)

pad = 16
label_h = 44
W = bc.width + ac.width + pad * 3
H = max(bc.height, ac.height) + label_h + pad * 2
canvas = Image.new('RGB', (W, H), (255, 255, 255))
d = ImageDraw.Draw(canvas)
canvas.paste(bc, (pad, label_h + pad))
canvas.paste(ac, (pad * 2 + bc.width, label_h + pad))
d.text((pad + 8, 14), 'BEFORE  h1 top 172px', fill=(200, 40, 40))
d.text((pad * 2 + bc.width + 8, 14), 'AFTER  h1 top 220px', fill=(30, 130, 40))
out = os.path.join(base, '_title-before-after.png')
canvas.save(out)
print(out, canvas.size)
