"""
作品集对比图生成器：把每一组「改前 / 改后」拼成左右并排、带标签的统一规格图。

    "D:/ComfyUI-aki-XZG/ComfyUI-aki-XZG/python/python.exe" scripts/portfolio-cmp.py

规格：
  · 每侧统一缩放到 700px 宽（高度按比例，不裁不变形）
  · 左右间隔 12px，四周留白 18px，底色 #F4F6F8（与小程序页底同色，贴上去不突兀）
  · 左上角贴标签：改前 = 深灰胶囊，改后 = 品牌玫红 #FC5294
  · 两侧高度不一致时顶部对齐、底部补底色（pantry-row 那组改后行变矮，就是这种）
"""
from PIL import Image, ImageDraw, ImageFont
import os

FONT = 'C:/Windows/Fonts/msyhbd.ttc'
BG = (244, 246, 248)
INK = (58, 63, 70)        # 改前标签底
ROSE = (252, 82, 148)     # 改后标签底 = 品牌玫红
GAP = 12
PAD = 18
W_SIDE = 700

OUT = 'outputs/portfolio/img'
os.makedirs(OUT, exist_ok=True)


def load(path, crop=None):
    im = Image.open(path).convert('RGB')
    if crop:
        im = im.crop(crop)
    return im


def fit(im):
    w, h = im.size
    return im.resize((W_SIDE, max(1, int(h * W_SIDE / w))), Image.LANCZOS)


def badge(draw, xy, text, color):
    """标签画在**图片下方**的条上，不覆盖内容（第一版压在左上角，正好盖住店名）。"""
    f = ImageFont.truetype(FONT, 19)
    l, t, r, b = draw.textbbox((0, 0), text, font=f)
    tw, th = r - l, b - t
    x, y = xy
    draw.rounded_rectangle([x, y, x + tw + 22, y + th + 15], radius=9, fill=color)
    draw.text((x + 11, y + 8 - t), text, font=f, fill=(255, 255, 255))


CASES = [
    dict(out='c1-order-thumb',
         before='outputs/orders-thumb-big-before/card-1.png',
         after='outputs/orders-thumb-big/card-1.png',
         # 只裁缩略图那一块：整张卡看缩略图差异太弱，放到 700px 宽才看得出「碗沿几乎贴边」
         crop_before=(10, 106, 302, 246), crop_after=(10, 106, 302, 246),
         lb='改前 缩略图留白多', la='改后 食材放大'),
    dict(out='c2-gacha-title',
         before='outputs/gacha-title-before/title.png',
         after='outputs/gacha-title/title.png',
         lb='改前 描边过重', la='改后 描边减半'),
    dict(out='c3-pantry-rail',
         # 原始的 pantry-row-before/*.png 拍空了（整片青柠底），只能从这个当年拼好的
         # 上下对比图里各裁一半出来重拼 —— 上=改前（有灰胶囊滑轨），下=改后（只留选中块）
         before='outputs/pantry-row/cmp-row.png',
         after='outputs/pantry-row/cmp-row.png',
         crop_before=(0, 0, 756, 152), crop_after=(0, 170, 756, 330),
         lb='改前 有滑轨', la='改后 去掉滑轨'),
    dict(out='c4-modal-badge',
         before='outputs/modals/badge-before-zoom.png',
         after='outputs/modals/badge-after-zoom.png',
         lb='改前 被裁', la='改后 居中'),
    dict(out='c5-modal-shell',
         before='outputs/modals/v1-health-plan.png',
         after='outputs/modals/v7-health-plan.png',
         # 只取左上角：外壳描边宽度 + 贴纸完整性都在这块里，整窗缩小后反而看不清
         crop_before=(0, 185, 400, 420), crop_after=(0, 185, 400, 420),
         lb='v1', la='v7'),
    dict(out='c6-me-bar',
         before='outputs/portfolio/img/before-me-bar.png',
         after='outputs/portfolio/img/after-me-bar.png',
         lb='改前 融进背景', la='改后 白描边'),
    dict(out='c7-menu-banner',
         before='outputs/portfolio/img/before-menu-banner.png',
         after='outputs/portfolio/img/after-menu-banner.png',
         lb='改前 129.5px', la='改后 99.8px'),
]

LABEL_H = 40

for c in CASES:
    left = fit(load(c['before'], c.get('crop_before')))
    right = fit(load(c['after'], c.get('crop_after')))
    H = max(left.height, right.height)
    canvas = Image.new('RGB', (PAD * 2 + W_SIDE * 2 + GAP, H + LABEL_H + PAD * 2), BG)
    canvas.paste(left, (PAD, PAD))
    canvas.paste(right, (PAD + W_SIDE + GAP, PAD))
    d = ImageDraw.Draw(canvas)
    badge(d, (PAD, PAD + H + 8), c.get('lb', '改前'), INK)
    badge(d, (PAD + W_SIDE + GAP, PAD + H + 8), c.get('la', '改后'), ROSE)
    path = f"{OUT}/{c['out']}.png"
    canvas.save(path)
    print(f"{canvas.size}  {path}")
