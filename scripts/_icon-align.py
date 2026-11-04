# -*- coding: utf-8 -*-
"""从 _icon-align.mjs 产出的 4x 元素截图里量：参考线 y / 图标墨迹中心 y / 文字墨迹中心 y
三者同图，取整偏置互相抵消。
墨迹判定：以区域众数亮度为底，差值 > 25% 峰值算墨；用 2%/98% 累计墨量定上下边，抗单像素噪声。
"""
import sys, json
import numpy as np
from PIL import Image

S = 4.0  # deviceScaleFactor

def ink_bounds(img, box):
    """box = (x,y,w,h) CSS px；返回 (top, bottom) CSS px"""
    x, y, w, h = [v * S for v in box]
    x0, y0 = int(round(x)), int(round(y))
    x1, y1 = int(round(x + w)), int(round(y + h))
    x0, y0 = max(0, x0), max(0, y0)
    x1, y1 = min(img.width, x1), min(img.height, y1)
    if x1 - x0 < 2 or y1 - y0 < 2:
        return None
    sub = np.asarray(img.convert('L').crop((x0, y0, x1, y1))).astype(float)
    bg = np.median(sub)
    diff = np.clip(bg - sub, 0, None)
    peak = diff.max()
    if peak < 8:
        return None
    mask = diff > peak * 0.25
    rows = mask.sum(axis=1).astype(float)
    tot = rows.sum()
    if tot <= 0:
        return None
    cum = np.cumsum(rows) / tot
    top = int(np.searchsorted(cum, 0.02))
    bot = int(np.searchsorted(cum, 0.98))
    return (y0 + top) / S, (y0 + bot) / S

def line_y(img):
    a = np.asarray(img.convert('RGB')).astype(int)
    m = (a[:, :, 0] > 190) & (a[:, :, 1] < 90) & (a[:, :, 2] < 90)
    rows = m.sum(axis=1).astype(float)
    if rows.sum() <= 0:
        return None
    return float(np.average(np.arange(len(rows)), weights=rows)) / S

for line in sys.stdin:
    line = line.strip()
    if not line.startswith('{'):
        continue
    meta = json.loads(line)
    img = Image.open(meta['file'])
    ly = line_y(img)
    ib = ink_bounds(img, (meta['icon']['x'], meta['icon']['y'], meta['icon']['w'], meta['icon']['h'])) if meta.get('icon') else None
    tb = ink_bounds(img, (meta['text']['x'], meta['text']['y'], meta['text']['w'], meta['text']['h']))
    print('\n=== %s  pill %sx%s' % (meta['textStr'], meta['pill']['w'], meta['pill']['h']))
    print('  参考线(胶囊几何中心) y = %.2f' % ly if ly is not None else '  参考线缺失')
    if ib:
        ic = (ib[0] + ib[1]) / 2
        print('  图标墨迹 %.2f ~ %.2f  中心 %.2f  → 相对参考线 %+.2f' % (ib[0], ib[1], ic, ic - ly))
    if tb:
        tc = (tb[0] + tb[1]) / 2
        print('  文字墨迹 %.2f ~ %.2f  中心 %.2f  → 相对参考线 %+.2f' % (tb[0], tb[1], tc, tc - ly))
    if ib and tb:
        print('  ★ 图标 − 文字 = %+.2f px' % (ic - tc))
