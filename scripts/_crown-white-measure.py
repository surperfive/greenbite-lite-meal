from PIL import Image
import numpy as np, sys

def ink(path, label):
    im = Image.open(path).convert('RGB')
    a = np.asarray(im).astype(int)
    # 白墨迹：三通道都 > 225（气泡是玫红 #FC5294，绿/蓝很低）
    white = (a[:,:,0] > 225) & (a[:,:,1] > 225) & (a[:,:,2] > 225)
    dark  = a.max(axis=2) < 100
    rows = np.where(white.any(axis=1))[0]
    print(f'{label}: size={im.size} dark_px={int(dark.sum())} white_px={int(white.sum())}', end=' ')
    if len(rows) == 0:
        print('NO_INK'); return None
    # 用行覆盖量加权求墨迹中心（比 min/max 更抗孤立噪点）
    w = white.sum(axis=1).astype(float)
    idx = np.arange(len(w))
    cy = (w*idx).sum()/w.sum()
    print(f'rows={rows.min()}..{rows.max()} center_weighted={cy:.2f} center_bbox={(rows.min()+rows.max())/2:.2f}')
    return cy

c = ink('scripts/_shots/w-crown.png', 'CROWN')
t = ink('scripts/_shots/w-text.png',  'TEXT ')
if c is not None and t is not None:
    # 两张图裁剪起点不同，但 y 起点相同(top)，可直接比
    print(f'\nΔ(center_weighted) = {c-t:+.2f}px @dpr4 = {(c-t)/4:+.2f}css')
    print('判据：|Δ| <= 1.2px@dpr4 (0.3css) 视为水平对齐')
