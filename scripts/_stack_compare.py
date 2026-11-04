"""把两张「同一区域」的截图上下拼接，加标签条和分隔线，便于对比。"""
from PIL import Image, ImageDraw
import sys

before, after, out = sys.argv[1], sys.argv[2], sys.argv[3]
label_h = 46
gap = 10

a = Image.open(before).convert("RGB")
b = Image.open(after).convert("RGB")
w = max(a.width, b.width)
W = w
H = a.height + b.height + label_h * 2 + gap * 3

canvas = Image.new("RGB", (W, H), (245, 246, 248))
d = ImageDraw.Draw(canvas)

y = 0
for img, text, color in ((a, "BEFORE  translate-y-2px", (60, 72, 88)), (b, "AFTER   translate-y-4px", (197, 90, 20))):
    d.rectangle([0, y, W, y + label_h], fill=(255, 255, 255))
    d.text((14, y + 16), text, fill=color)
    y += label_h
    canvas.paste(img, (0, y))
    y += img.height + gap

canvas.save(out)
print(f"{out} {canvas.width}x{canvas.height}")
