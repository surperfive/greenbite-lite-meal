# -*- coding: utf-8 -*-
"""读 _pill-gaps.mjs 的 4x 元素截图，量文字墨迹的上/下留白（相对胶囊几何中心对称与否）
判据：上留白 = 墨迹顶 − 胶囊顶；下留白 = 胶囊底 − 墨迹底。
理想：两者相等（差值 0）；差值为正 = 文字偏高。
墨迹底取 0.15 阈值；同时输出参考线位置做自校验。
"""
import sys, json
import numpy as np
from PIL import Image

S = 4.0

def ink_box(img, box, thr=0.15):
    x, y, w, h = [v * S for v in box]
    x0, y0 = max(0, int(round(x))), max(0, int(round(y)))
    x1, y1 = min(img.width, int(round(x + w))), min(img.height, int(round(y + h)))
    sub = np.asarray(img.convert('L').crop((x0, y0, x1, y1))).astype(float)
    bg = np.median(sub)
    diff = np.clip(bg - sub, 0, None)
    peak = diff.max()
    mask = diff > peak * thr
    rows = mask.sum(axis=1).astype(float)
    tot = rows.sum()
    if tot <= 0:
        return None
    cum = np.cumsum(rows) / tot
    return (y0 + int(np.searchsorted(cum, 0.01))) / S, (y0 + int(np.searchsorted(cum, 0.99))) / S

def line_y(img):
    a = np.asarray(img.convert('RGB')).astype(int)
    m = (a[:, :, 0] > 190) & (a[:, :, 1] < 90) & (a[:, :, 2] < 90)
    rows = m.sum(axis=1).astype(float)
    return float(np.average(np.arange(len(rows)), weights=rows)) / S if rows.sum() else None

for line in sys.stdin:
    line = line.strip()
    if not line.startswith('{'):
        continue
    m = json.loads(line)
    img = Image.open(m['file'])
    H = m['pill']['h']
    b = ink_box(img, (m['text']['x'], m['text']['y'], m['text']['w'], m['text']['h']))
    if not b:
        print('=== %s  墨迹未识别' % m['textStr'])
        continue
    top_gap = b[0]
    bot_gap = H - b[1]
    ly = line_y(img)
    print('\n=== «%s»  pill %.2f×%.2f  fs=%s lh=%s pill-label=%s' % (m['textStr'], m['pill']['w'], H, m['fs'], m['lh'], m['hasLabel']))
    print('  墨迹 %.2f ~ %.2f   上留白 %.2f  下留白 %.2f   → 偏高 %+.2f px' % (b[0], b[1], top_gap, bot_gap, bot_gap - top_gap))
    if ly is not None:
        print('  墨迹中心 %.2f / 胶囊中心 %.2f  (差 %+.2f)' % ((b[0] + b[1]) / 2, ly, (b[0] + b[1]) / 2 - ly))
