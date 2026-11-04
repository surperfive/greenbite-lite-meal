# -*- coding: utf-8 -*-
"""详情页改造前后并排对比图：左 = 用户给的参考截图（改造前），右 = 改造后渲染。
用法：python scripts/make-detail-compare.py
"""
from PIL import Image, ImageDraw, ImageFont
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'outputs', 'detail-ui')

BEFORE = r'C:\Users\kccog\.workbuddy-ai\clipboard-images\clipboard-2026-10-13T05-07-33-935Z-82b33d72.png'
AFTER = os.path.join(OUT, '01-detail-top.png')

H = 1100          # 统一高度
GAP = 28
PAD = 28
LABEL_H = 40

def load(p):
    im = Image.open(p).convert('RGB')
    w = int(im.width * H / im.height)
    return im.resize((w, H), Image.LANCZOS)

a = load(BEFORE)
b = load(AFTER)

W = PAD * 2 + a.width + GAP + b.width
canvas = Image.new('RGB', (W, H + PAD * 2 + LABEL_H), '#F4F6F8')
d = ImageDraw.Draw(canvas)

try:
    font = ImageFont.truetype(r'C:\Windows\Fonts\msyhbd.ttc', 22)
except Exception:
    font = ImageFont.load_default()

top = PAD + LABEL_H
canvas.paste(a, (PAD, top))
canvas.paste(b, (PAD + a.width + GAP, top))

d.text((PAD, PAD + 6), '改造前（参考截图）', fill='#111827', font=font)
d.text((PAD + a.width + GAP, PAD + 6), '改造后（抽卡页语言）', fill='#26430B', font=font)

# 中线
mid = PAD + a.width + GAP // 2
d.line([(mid, PAD), (mid, canvas.height - PAD)], fill='#CBD5E1', width=2)

path = os.path.join(OUT, 'compare.png')
canvas.save(path)
print('saved', path, canvas.size)
