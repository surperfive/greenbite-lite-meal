"""把「大杯 → 超大杯」这一次切换拆成逐帧条带，用来看清下坠 + 回弹的每一拍。

源帧：ffmpeg 从 outputs/motion/16-portion-分量切换.mp4 的 0.5s 起按 30fps 抽，
crop=520:440:130:0 只留杯身与底部白卡（第一次点击发生在 0.533s，所以第 1 帧=点击前）。

产物：outputs/motion/16-portion-分量切换-逐帧.png（4×2，0 → 233ms）
"""
import os
from PIL import Image, ImageDraw, ImageFont

SRC = "outputs/motion/_p"
OUT = "outputs/motion/16-portion-分量切换-逐帧.png"

FRAMES = sorted(f for f in os.listdir(SRC) if f.startswith("g_") and f.endswith(".png"))[:8]
MS = [0, 33, 67, 100, 133, 167, 200, 233]

COLS = 4
IMG_W = 372
COL_W = IMG_W + 24
ROW_GAP = 20
PAD = 28
LABEL_H = 46
BG = (244, 246, 248)
INK = (23, 26, 28)
MUTED = (138, 145, 152)
LINE = (226, 231, 236)


def font(size, bold=False):
    names = ["msyhbd.ttc", "msyh.ttc"] if bold else ["msyh.ttc", "msyhbd.ttc"]
    for name in names:
        for root in (r"C:\Windows\Fonts", os.path.expandvars(r"%LOCALAPPDATA%\Microsoft\Windows\Fonts")):
            p = os.path.join(root, name)
            if os.path.exists(p):
                return ImageFont.truetype(p, size)
    return ImageFont.load_default()


first = Image.open(os.path.join(SRC, FRAMES[0]))
IMG_H = round(first.height * IMG_W / first.width)
rows = (len(FRAMES) + COLS - 1) // COLS

W = PAD * 2 + COL_W * COLS - 24
H = PAD * 2 + rows * (IMG_H + LABEL_H) + (rows - 1) * ROW_GAP
sheet = Image.new("RGB", (W, H), BG)
d = ImageDraw.Draw(sheet)

f_ms = font(27, bold=True)
f_note = font(20)

for i, (name, ms) in enumerate(zip(FRAMES, MS)):
    r, c = divmod(i, COLS)
    im = Image.open(os.path.join(SRC, name)).convert("RGB").resize((IMG_W, IMG_H), Image.LANCZOS)
    x = PAD + c * COL_W
    y = PAD + r * (IMG_H + LABEL_H + ROW_GAP)
    d.rectangle([x - 1, y - 1, x + IMG_W, y + IMG_H], fill=(255, 255, 255), outline=LINE)
    sheet.paste(im, (x, y))
    cx = x + IMG_W // 2
    label = "点击前" if i == 0 else f"+{ms}ms"
    tw = d.textlength(label, font=f_ms)
    d.text((cx - tw / 2, y + IMG_H + 10), label, font=f_ms, fill=MUTED if i == 0 else INK)

sheet.save(OUT, optimize=True)
print(OUT, sheet.size)
