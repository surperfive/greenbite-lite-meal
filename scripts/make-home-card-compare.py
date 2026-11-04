# -*- coding: utf-8 -*-
"""单张入口卡片放大对比：参考图「外卖配送」vs 改造后同卡，两边同宽便于对读内部比例。
用法：python scripts/make-home-card-compare.py
"""
import os
from PIL import Image, ImageDraw, ImageFont

REF = r'C:\Users\kccog\.workbuddy-ai\clipboard-images\clipboard-2026-10-13T08-17-52-178Z-806455ce.jpg'
AFTER = os.path.join('outputs', 'home-ref', 'home-after.png')
OUT = os.path.join('outputs', 'home-ref')

# 参考图：外卖配送卡（真实 px 8.4,291.3 - 184.6,405.3），图 px = 真实 * 2.509
S_REF = 941 / 375.0
ref_box = (int(8 * S_REF), int(289 * S_REF), int(186 * S_REF), int(408 * S_REF))

# 改造后截图：deviceScaleFactor=2，壳从 x=5 起；卡片 = 壳内 x10-202, y316-441
after_box = (int((5 + 8) * 2), int(314 * 2), int((5 + 204) * 2), int(443 * 2))

ref = Image.open(REF).convert('RGB').crop(ref_box)
aft = Image.open(AFTER).convert('RGB').crop(after_box)

W = 440
ref = ref.resize((W, int(ref.height * W / ref.width)), Image.LANCZOS)
aft = aft.resize((W, int(aft.height * W / aft.width)), Image.LANCZOS)

GAP, PAD, LABEL = 24, 24, 34
H = max(ref.height, aft.height)
canvas = Image.new('RGB', (PAD * 2 + W * 2 + GAP, PAD * 2 + LABEL + H), '#F4F6F8')
d = ImageDraw.Draw(canvas)
try:
    f = ImageFont.truetype(r'C:\Windows\Fonts\msyhbd.ttc', 18)
except Exception:
    f = ImageFont.load_default()
canvas.paste(ref, (PAD, PAD + LABEL))
canvas.paste(aft, (PAD + W + GAP, PAD + LABEL))
d.text((PAD, PAD + 4), f'参考图卡片 176x114（真实px）', fill='#111827', font=f)
d.text((PAD + W + GAP, PAD + 4), f'改造后卡片 192x125（壳px）', fill='#26430B', font=f)
# 把「同宽」换算出的等高参考线画上：参考卡 176 宽 → 本图 W；改造卡 192 宽 → 本图 W
# 两者高度若比例一致，应分别占满各自列
p = os.path.join(OUT, 'compare-card.png')
canvas.save(p)
print('saved', p, canvas.size, 'ref crop', ref_box, 'after crop', after_box)
