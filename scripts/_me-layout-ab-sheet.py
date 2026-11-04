"""排版 A/B 拼图：上=三行（旧）vs 下=两行（新）。
   只在每行的右端画一根刻度线 + 宽度数字 —— 楼梯感/矩形感一眼可见，又不遮挡内容。"""
from PIL import Image, ImageDraw, ImageFont
import pathlib, json

OUT = pathlib.Path("scripts/_shots")
d0 = json.loads((OUT / "lay-rects.json").read_text(encoding="utf-8"))
before, after = d0["before"], d0["after"]
S = 3
a = Image.open(OUT / "lay-before.png").convert("RGB")
b = Image.open(OUT / "lay-after.png").convert("RGB")

LBL, PAD_T, HDR, GAP = 24, 12, 48, 36
W = a.size[0] + LBL * 2
H = PAD_T + HDR + a.size[1] + GAP + HDR + b.size[1] + 22
sheet = Image.new("RGB", (W, H), (244, 246, 249))
d = ImageDraw.Draw(sheet)
F = "C:/Windows/Fonts/msyhbd.ttc"
f = ImageFont.truetype(F, 26)
f_num = ImageFont.truetype(F, 22)

def ticks(img, rows, color):
    dd = ImageDraw.Draw(img)
    for (t, bb, r, w) in rows:
        x = r * S + 6
        dd.line([(x, t * S - 3), (x, bb * S + 3)], fill=color, width=3)
        dd.text((x + 8, (t + bb) / 2 * S - 12), str(w), font=f_num, fill=color)
    return img

def union(*rs):
    return (min(x["t"] for x in rs), max(x["b"] for x in rs),
            max(x["r"] for x in rs), round(max(x["r"] for x in rs) - rs[0]["l"]))

rows_before = [union(before["h1"]), union(before["pill"]), union(before["gauge"])]
rows_after = [union(after["h1"], after["pill"]), union(after["gauge"])]

a2 = ticks(a.copy(), rows_before, (230, 0, 18))
b2 = ticks(b.copy(), rows_after, (84, 128, 26))

y = PAD_T
d.text((LBL, y), "旧 · 三行三种右端 ＝ 一段楼梯", font=f, fill=(230, 0, 18))
sheet.paste(a2, (LBL, y + HDR))
y2 = y + HDR + a.size[1] + GAP
d.text((LBL, y2), "新 · 两行近等宽 ＝ 一个矩形块", font=f, fill=(84, 128, 26))
sheet.paste(b2, (LBL, y2 + HDR))

out = OUT / "me-layout-3rows-vs-2rows.png"
sheet.save(out)
print("saved", out, sheet.size, rows_before, rows_after)
