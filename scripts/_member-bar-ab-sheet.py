"""身份条 46 vs 42 拼图（上=旧 46，下=新 42），带中文标签。
用法：D:\\ComfyUI-aki-XZG\\ComfyUI-aki-XZG\\python\\python.exe scripts/_member-bar-ab-sheet.py
"""
from PIL import Image, ImageDraw, ImageFont
import pathlib

OUT = pathlib.Path("scripts/_shots")
old = Image.open(OUT / "mb46.png")
new = Image.open(OUT / "mb42.png")
assert old.size == new.size, (old.size, new.size)

PAD_L, PAD_T, GAP = 132, 30, 26
W = old.size[0] + PAD_L + 24
H = PAD_T + old.size[1] + GAP + new.size[1] + 24
sheet = Image.new("RGB", (W, H), (244, 246, 249))

FONT = "C:/Windows/Fonts/msyhbd.ttc"
f_big = ImageFont.truetype(FONT, 30)
f_sm = ImageFont.truetype(FONT, 24)

d = ImageDraw.Draw(sheet)
y_old = PAD_T
y_new = PAD_T + old.size[1] + GAP
sheet.paste(old, (PAD_L, y_old))
sheet.paste(new, (PAD_L, y_new))

d.text((16, y_old + old.size[1] // 2 - 30), "旧", font=f_big, fill=(120, 128, 140))
d.text((16, y_old + old.size[1] // 2 + 2), "46px", font=f_sm, fill=(120, 128, 140))
d.text((16, y_new + new.size[1] // 2 - 30), "新", font=f_big, fill=(84, 128, 26))
d.text((16, y_new + new.size[1] // 2 + 2), "42px", font=f_sm, fill=(84, 128, 26))

# 卡片的水平中心线（两张都用同一个裁切高度 54 → 中线在同一条）
d.line([(PAD_L, y_old + old.size[1] // 2), (W - 8, y_old + old.size[1] // 2)], fill=(230, 0, 18), width=2)
d.line([(PAD_L, y_new + new.size[1] // 2), (W - 8, y_new + new.size[1] // 2)], fill=(230, 0, 18), width=2)

out = OUT / "member-bar-46-vs-42.png"
sheet.save(out)
print("saved", out, sheet.size)
