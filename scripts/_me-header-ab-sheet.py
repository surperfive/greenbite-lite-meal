"""「我的」页头部 A/B 拼图（左=改前 190，右=改后 166），带中文标签与高度参考线。"""
from PIL import Image, ImageDraw, ImageFont
import pathlib

OUT = pathlib.Path("scripts/_shots")
a = Image.open(OUT / "me-before.png")
b = Image.open(OUT / "me-after.png")
assert a.size == b.size, (a.size, b.size)

PAD_T, GAP, LBL = 62, 26, 190
W = LBL + a.size[0] + GAP + b.size[0] + 24
H = PAD_T + a.size[1] + 24
sheet = Image.new("RGB", (W, H), (244, 246, 249))
d = ImageDraw.Draw(sheet)
FONT = "C:/Windows/Fonts/msyhbd.ttc"
f_big = ImageFont.truetype(FONT, 34)
f_sm = ImageFont.truetype(FONT, 26)

d.text((LBL, 12), "改前 · 190px（桌面宽视口 216px）", font=f_sm, fill=(120, 128, 140))
d.text((LBL + a.size[0] + GAP, 12), "改后 · 166px", font=f_sm, fill=(84, 128, 26))

sheet.paste(a, (LBL, PAD_T))
sheet.paste(b, (LBL + a.size[0] + GAP, PAD_T))

# 两条高度参考线：改前 banner 底边 190×3，改后 166×3（截图是 3× 像素）
d.line([(LBL - 8, PAD_T + 190 * 3), (LBL + a.size[0], PAD_T + 190 * 3)], fill=(230, 0, 18), width=3)
d.line([(LBL + a.size[0] + GAP - 8, PAD_T + 166 * 3), (LBL + a.size[0] + GAP + b.size[0], PAD_T + 166 * 3)], fill=(84, 128, 26), width=3)

# 头像顶边参考线（改前 48，改后 28）
d.line([(LBL - 8, PAD_T + 48 * 3), (LBL + a.size[0], PAD_T + 48 * 3)], fill=(230, 0, 18), width=2)
d.line([(LBL + a.size[0] + GAP - 8, PAD_T + 28 * 3), (LBL + a.size[0] + GAP + b.size[0], PAD_T + 28 * 3)], fill=(84, 128, 26), width=2)

d.text((10, PAD_T + 30 * 3), "头像\n顶边", font=f_sm, fill=(230, 0, 18))
d.text((10, PAD_T + 172 * 3), "banner\n底边", font=f_sm, fill=(230, 0, 18))

out = OUT / "me-header-190-vs-166.png"
sheet.save(out)
print("saved", out, sheet.size)
