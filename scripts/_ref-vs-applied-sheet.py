"""参考（首页身份条）vs 应用（我的页头部）拼图：信息结构对照。"""
from PIL import Image, ImageDraw, ImageFont
import pathlib

OUT = pathlib.Path("scripts/_shots")
ref = Image.open(OUT / "ref-memberbar.png")
app = Image.open(OUT / "applied-meblock.png")

LBL, PAD_T, HDR, GAP = 24, 14, 44, 28
W = max(ref.size[0], app.size[0]) + LBL * 2
H = PAD_T + HDR + ref.size[1] + GAP + HDR + app.size[1] + 24
sheet = Image.new("RGB", (W, H), (244, 246, 249))
d = ImageDraw.Draw(sheet)
F = "C:/Windows/Fonts/msyhbd.ttc"
f = ImageFont.truetype(F, 26)

y = PAD_T
d.text((LBL, y), "参考 · 首页身份条：昵称 / 等级胶囊 / 积分 / 满宽进度条", font=f, fill=(120, 128, 140))
sheet.paste(ref, (LBL, y + HDR))

y2 = y + HDR + ref.size[1] + GAP
d.text((LBL, y2), "应用 · 我的页头部：同一套信息，等比放大", font=f, fill=(84, 128, 26))
sheet.paste(app, (LBL, y2 + HDR))

out = OUT / "ref-vs-applied.png"
sheet.save(out)
print("saved", out, sheet.size)
