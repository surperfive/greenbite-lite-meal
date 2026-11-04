"""量「会员皇冠徽章」里皇冠相对白圆的位置（输入 8× 局部截图）。

为什么要这么绕，踩过的坑都在这三条里：

① **不能拿「白像素连通域」当圆**。皇冠是白圆里的一块黑，白色质心会被皇冠推开，
   算出来的圆心天生偏。改用**黑色描边环**定圆心 —— 环是左右/上下对称的，
   它的 bbox 中心就是真圆心。
② **不能拿矩形 inner-mask 量留白**。矩形四角会吃到描边环的黑像素，
   曾经因此量出「皇冠 11×11 = 白圆等大」的荒谬结果。必须用**圆形** mask 且半径内缩 ≥4px。
③ 描边厚度要**实测**（沿圆心上方那一条竖线数连续黑像素），不能用 viewBox 里的 3 单位换算，
   因为 Chrome 在 14px 圆上会对 stroke 做亚像素抗锯齿，实际覆盖像素比理论值多。

输出：CSS px 为单位（除以 8）。
"""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage

PATH = sys.argv[1] if len(sys.argv) > 1 else 'scripts/_shots/crown-badge-8x.png'
SCALE = float(sys.argv[2]) if len(sys.argv) > 2 else 8.0

im = Image.open(PATH).convert('RGB')
a = np.asarray(im).astype(np.int16)
H, W = a.shape[:2]
print(f'image {W}x{H}  (scale {SCALE}×)')

# ── 黑像素（描边环 + 皇冠 + 可能的投影）────────────────────────────────
black = a.max(axis=2) < 100
lab, n = ndimage.label(black)
if n == 0:
    sys.exit('没找到黑像素，截图可能裁偏了')

sizes = ndimage.sum(black, lab, range(1, n + 1))
objs = ndimage.find_objects(lab)
# 描边环：面积最大、且 bbox 接近正方形的那个连通域
best, best_score = None, -1
for i, sl in enumerate(objs, start=1):
    if sl is None:
        continue
    h = sl[0].stop - sl[0].start
    w = sl[1].stop - sl[1].start
    if h < 20 or w < 20:
        continue
    score = sizes[i - 1] * min(h, w) / max(h, w)   # 面积 × 方正度
    if score > best_score:
        best, best_score = i, score
if best is None:
    sys.exit('没找到描边环连通域')
ring = lab == best
ys, xs = np.nonzero(ring)
cx = (xs.min() + xs.max() + 1) / 2.0
cy = (ys.min() + ys.max() + 1) / 2.0
r_out = ((xs.max() + 1 - xs.min()) + (ys.max() + 1 - ys.min())) / 4.0
print(f'圆环 bbox  x[{xs.min()},{xs.max()}] y[{ys.min()},{ys.max()}]')
print(f'圆心 ({cx:.2f},{cy:.2f})  外半径 {r_out:.2f}px_img = {r_out/SCALE:.3f} css')

# ── 描边厚度：圆心正上方那一条竖线，从外向内数连续黑 ────────────────────
col = int(round(cx))
top = int(ys.min())
thick = 0
while top + thick < H and black[top + thick, col]:
    thick += 1
print(f'描边厚度 {thick}px_img = {thick/SCALE:.3f} css')
r_in = r_out - thick
print(f'内半径 {r_in:.2f}px_img = {r_in/SCALE:.3f} css')

# ── 皇冠：圆内（内缩 4px_img 避开描边抗锯齿）的黑像素 ──────────────────
yy, xx = np.mgrid[0:H, 0:W]
dist = np.hypot(xx + 0.5 - cx, yy + 0.5 - cy)
inner = black & (dist < r_in - 4)
# 排除描边环本身的像素（环有抗锯齿外溢，圆形 mask 已经挡掉绝大部分，双保险）
inner &= ~ndimage.binary_dilation(ring, iterations=1)
if not inner.any():
    sys.exit('圆内没找到皇冠黑像素')
cys, cxs = np.nonzero(inner)
x0, x1 = cxs.min(), cxs.max() + 1
y0, y1 = cys.min(), cys.max() + 1
print(f'皇冠 bbox  x[{x0},{x1}] y[{y0},{y1}]  '
      f'{(x1-x0)/SCALE:.3f} × {(y1-y0)/SCALE:.3f} css')

L = (x0 - (cx - r_in)) / SCALE
R = ((cx + r_in) - x1) / SCALE
T = (y0 - (cy - r_in)) / SCALE
B = ((cy + r_in) - y1) / SCALE
print(f'四边留白(内径基准)  左 {L:.3f}  右 {R:.3f}  上 {T:.3f}  下 {B:.3f}')
print(f'→ 水平偏差 {(L-R):+.3f} css px   （正 = 偏右）')
print(f'→ 垂直偏差 {(T-B):+.3f} css px   （正 = 偏下）')

# ── 墨迹质心 vs 圆心（"视觉居中"用的判据）────────────────────────────
mcy = cys.mean() + 0.5
mcx = cxs.mean() + 0.5
print(f'皇冠墨迹质心 ({mcx:.2f},{mcy:.2f})  圆心 ({cx:.2f},{cy:.2f})')
print(f'→ 质心偏移  x {(mcx-cx)/SCALE:+.3f}  y {(mcy-cy)/SCALE:+.3f} css px')
print(f'→ bbox 中心偏移  x {((x0+x1)/2-cx)/SCALE:+.3f}  y {((y0+y1)/2-cy)/SCALE:+.3f} css px')
