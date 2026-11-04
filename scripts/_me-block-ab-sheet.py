"""「我的」页圈中组件 A/B 拼图（上=改前，下=改后）。标签放各自面板上方。"""
from PIL import Image, ImageDraw, ImageFont
import pathlib

OUT = pathlib.Path("scripts/_shots")
a = Image.open(OUT / "meb-before.png")
b = Image.open(OUT / "meb-after.png")
assert a.size == b.size, (a.size, b.size)

LBL, PAD_T, HDR, GAP = 24, 16, 46, 30
W = LBL * 2 + a.size[0]
H = PAD_T + HDR + a.size[1] + GAP + HDR + b.size[1] + 20
sheet = Image.new("RGB", (W, H), (244, 246, 249))
d = ImageDraw.Draw(sheet)
F = "C:/Windows/Fonts/msyhbd.ttc"
f2 = ImageFont.truetype(F, 26)

y1 = PAD_T
d.text((LBL, y1), "改前 · 头像 86 / 昵称 26 / 胶囊 12 · 无进度条", font=f2, fill=(120, 128, 140))
sheet.paste(a, (LBL, y1 + HDR))

y2 = y1 + HDR + a.size[1] + GAP
d.text((LBL, y2), "改后 · 头像 76 / 昵称 22 / 胶囊 11 · 带升级进度条", font=f2, fill=(84, 128, 26))
sheet.paste(b, (LBL, y2 + HDR))

out = OUT / "me-block-before-after.png"
sheet.save(out)
print("saved", out, sheet.size)
