"""像素级校验「9折限时」徽章内部对齐：分别求皇冠 / 文字的墨迹垂直中心与左右留白。

用法：先跑 _gacha-badge-shot.mjs 出图，再 python scripts/_gacha-badge-align.py
⚠️ 只用 ComfyUI 的 python（系统 python 没有 PIL）。
⚠️ y 范围必须卡在**胶囊主体**内（22~69 用户单位）：再往下会吃到胶囊底部的
   白色描边和下方「十连抽」按钮的黑色边框，把文字的墨迹中心算歪。
"""
from PIL import Image
import sys

p = sys.argv[1] if len(sys.argv) > 1 else 'scripts/_shots/gacha-badge.png'
im = Image.open(p).convert('RGB')
SCALE = 3
PAD = 16 * SCALE

# 徽章 bbox（屏幕坐标，_gacha-badge-shot.mjs 打印）；用户坐标 → 屏幕 = ×0.4617
BX, BY, BW = 326.25, 350.35, 75.80
U2S = 0.4617
# 胶囊主体（含描边）用户 y 19~72 → 屏幕
top_y = PAD + (19 * U2S) * SCALE
bot_y = PAD + (72 * U2S) * SCALE
x0 = PAD
x1 = PAD + BW * SCALE
px = im.load()


def ink(xa, xb, ya=None, yb=None):
    ys, xs = [], []
    for y in range(int(ya if ya is not None else top_y), int(yb if yb is not None else bot_y)):
        for x in range(int(xa), int(xb)):
            r, g, b = px[x, y]
            if r < 110 and g < 110 and b < 110:
                ys.append(y); xs.append(x)
    if not ys:
        return None
    return {'top': min(ys), 'bottom': max(ys), 'cy': sum(ys) / len(ys),
            'left': min(xs), 'right': max(xs)}


split = PAD + (344.0 - BX) * SCALE     # 皇冠右 342.2 / 文字左 345.6 之间
# ⚠️ 文字区右边界卡在 240（屏幕 ~390）：再往右会吃到胶囊右下方的
#    「十连抽」按钮黑色描边，把文字墨迹中心往下拽。
crown = ink(x0, split, PAD + 20, PAD + 62)
text = ink(split, PAD + 240, PAD + 20, PAD + 62)
print('皇冠', {k: round(v, 1) for k, v in crown.items()})
print('文字', {k: round(v, 1) for k, v in text.items()})
print()
print(f"垂直中心差（文字−皇冠）= {(text['cy'] - crown['cy']) / SCALE:+.2f}px")
print(f"左留白 {(crown['left'] - x0) / SCALE:.2f}px  右留白 {(x1 - text['right']) / SCALE:.2f}px  （均到白描边外缘）")
print(f"皇冠-文字间距 {(text['left'] - crown['right']) / SCALE:.2f}px")
