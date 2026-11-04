# -*- coding: utf-8 -*-
"""首页版面 vs 参考图 并排对比（两边都缩到同一宽度，比例可直接对读）。
用法：python scripts/make-home-compare.py
"""
import os
from PIL import Image, ImageDraw, ImageFont

REF = r'C:\Users\kccog\.workbuddy-ai\clipboard-images\clipboard-2026-10-13T08-17-52-178Z-806455ce.jpg'
AFTER = os.path.join('outputs', 'home-ref', 'home-after.png')
OUT = os.path.join('outputs', 'home-ref')

W = 470          # 统一宽度
GAP, PAD, LABEL = 24, 24, 36

ref = Image.open(REF).convert('RGB')
aft = Image.open(AFTER).convert('RGB')


def fit(im, w):
    return im.resize((w, int(im.height * w / im.width)), Image.LANCZOS)


ref = fit(ref, W)
aft = fit(aft, W)
H = max(ref.height, aft.height)

canvas = Image.new('RGB', (PAD * 2 + W * 2 + GAP, PAD * 2 + LABEL + H), '#F4F6F8')
d = ImageDraw.Draw(canvas)
try:
    f = ImageFont.truetype(r'C:\Windows\Fonts\msyhbd.ttc', 20)
except Exception:
    f = ImageFont.load_default()

top = PAD + LABEL
canvas.paste(ref, (PAD, top))
canvas.paste(aft, (PAD + W + GAP, top))
d.text((PAD, PAD + 6), '参考图（375 设备）', fill='#111827', font=f)
d.text((PAD + W + GAP, PAD + 6), '改造后（410 手机壳）', fill='#26430B', font=f)

# 参考图里各组件边界（真实 px → 本图 y）：hero 底 278 / 卡片行1 292-405 /
# 卡片行2 413-528 / 限时福利条 539-605
S = W / 375.0
for real, name in [(278, 'hero 底'), (405, '行1 底'), (528, '行2 底'), (605, '福利条底')]:
    y = top + real * S
    if y < canvas.height - PAD:
        d.line([(PAD, y), (PAD + W * 2 + GAP, y)], fill=(255, 0, 0), width=1)
        d.text((PAD + W * 2 + GAP - 92, y + 2), name, fill=(255, 0, 0), font=f)

p = os.path.join(OUT, 'compare-home.png')
canvas.save(p)
print('saved', p, canvas.size)
