# -*- coding: utf-8 -*-
"""在参考图上叠标尺网格，便于直接读出各组件边界。
用法：python scripts/grid-home-ref.py
输出：outputs/home-ref/grid-full.png（全图，每 50px 一条线）
      outputs/home-ref/grid-grid.png（2x2 卡片区放大 + 每 25px 网格）
"""
import os
from PIL import Image, ImageDraw, ImageFont

SRC = r'C:\Users\kccog\.workbuddy-ai\clipboard-images\clipboard-2026-10-13T08-17-52-178Z-806455ce.jpg'
OUT = os.path.join('outputs', 'home-ref')
os.makedirs(OUT, exist_ok=True)

im = Image.open(SRC).convert('RGB')
W, H = im.size
SCALE = 941 / 375.0          # 图 -> 真实设备 px（推定 375 宽）
print(f'图 {W}x{H}  缩放 {SCALE:.3f}  真实设备 {375:.0f}x{H/SCALE:.0f}')


def grid(img, step, label_step, tag, ox=0, oy=0, zoom=1):
    """img 是裁剪+放大后的图；ox/oy 是该图左上角在**原图**中的坐标，zoom 是放大倍数。
    标签一律换算回**原图坐标**与**真实设备 px**，避免被放大倍数绕晕。"""
    d = ImageDraw.Draw(img)
    try:
        f = ImageFont.truetype(r'C:\Windows\Fonts\msyh.ttc', 22)
    except Exception:
        f = ImageFont.load_default()
    w, h = img.size
    for yy in range(0, h, step):
        d.line([(0, yy), (w, yy)], fill=(255, 0, 0), width=1)
        if yy % label_step == 0:
            orig = oy + yy / zoom
            d.text((4, yy + 2), f'img{orig:.0f} / real{orig/SCALE:.0f}', fill=(255, 0, 0), font=f)
    for xx in range(0, w, step):
        d.line([(xx, 0), (xx, h)], fill=(0, 120, 255), width=1)
        if xx % label_step == 0:
            orig = ox + xx / zoom
            d.text((xx + 2, 2), f'{orig/SCALE:.0f}', fill=(0, 120, 255), font=f)
    p = os.path.join(OUT, f'{tag}.png')
    img.save(p)
    print('saved', p, img.size)
    return p


# 1) 全图 + 每 50 图 px 网格
grid(im.copy(), 50, 100, 'grid-full')

# 2) 2x2 卡片区放大（y 780-1360 原图坐标）
C1Y0, C1Y1 = 780, 1360
crop = im.crop((0, C1Y0, W, C1Y1))
crop = crop.resize((crop.width * 2, crop.height * 2), Image.LANCZOS)
grid(crop, 50, 100, 'grid-cards', oy=C1Y0, zoom=2)

# 3) 底部（限时福利 + 分类 tab）
C2Y0 = 1360
crop2 = im.crop((0, C2Y0, W, H))
crop2 = crop2.resize((crop2.width * 2, crop2.height * 2), Image.LANCZOS)
grid(crop2, 50, 100, 'grid-bottom', oy=C2Y0, zoom=2)

# 4) 顶部 hero
crop3 = im.crop((0, 0, W, 800))
grid(crop3, 50, 100, 'grid-hero')
