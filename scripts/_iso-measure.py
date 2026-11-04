from PIL import Image
import numpy as np

# 台架：1 用户单位 = 4 css = 8 px（dpr2）
PX_PER_UNIT = 8.0

def load(p):
    return np.asarray(Image.open(p).convert('RGB')).astype(int)

def stats(p, label):
    a = load(p)
    white = (a[:,:,0] > 235) & (a[:,:,1] > 225) & (a[:,:,2] > 235)
    dark  = a.max(axis=2) < 100
    rows = np.where(white.any(axis=1))[0]
    d = f'{label}: {a.shape[1]}x{a.shape[0]} white={int(white.sum())} dark={int(dark.sum())}'
    if len(rows) == 0:
        print(d + '  NO_INK'); return None
    w = white.sum(axis=1).astype(float)
    idx = np.arange(len(w))
    cy_w = (w*idx).sum()/w.sum()
    cy_b = (rows.min()+rows.max())/2
    print(d + f' rows={rows.min()}..{rows.max()} cy_weighted={cy_w:.2f} cy_bbox={cy_b:.2f} (px)')
    return cy_w, cy_b, rows.min(), rows.max()

print('== 单位换算：1 unit = 8px ==')
c = stats('scripts/_shots/iso-crown.png', 'CROWN')
t = stats('scripts/_shots/iso-text.png',  'TEXT ')

if c and t:
    for name, i in (('weighted', 0), ('bbox', 1)):
        d = c[i] - t[i]
        print(f'Δ{name:9s} = {d:+.2f}px = {d/PX_PER_UNIT:+.3f} unit')
    # 转成 SVG 用户单位后与理论值比对（裁剪条 y 起点 = inner.y = 27）
    for name, i in (('weighted', 0), ('bbox', 1)):
        cu = 27 + c[i]/PX_PER_UNIT
        tu = 27 + t[i]/PX_PER_UNIT
        print(f'{name:9s} 皇冠中心 y={cu:.3f}u  文字中心 y={tu:.3f}u')
    db = (c[1]-t[1])/PX_PER_UNIT
    dm = (c[0]-t[0])/PX_PER_UNIT
    print('\n判定口径（2026-10-30 定）：')
    print('  主判据 = 轮廓(bbox)中心差，容差 0.6u —— 宽扁实心皇冠按轮廓居中看才齐')
    print('  参考值 = 墨量加权中心差（质心口径，2026-10-28 火焰那条规则用这个）')
    print(f'  bbox Δ = {db:+.3f}u  ' + ('✅ 达标' if abs(db) <= 0.6 else '❌ 超差'))
    print(f'  mass Δ = {dm:+.3f}u  （皇冠底宽必然偏下，不单独作为判据）')
