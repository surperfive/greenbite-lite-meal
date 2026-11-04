# -*- coding: utf-8 -*-
"""量「内部红线」图：红线 = 胶囊 50% 处（绝对定位，不参与布局）。
   墨迹中心相对红线的偏移 delta（正 = 文字偏低）。
"""
import json, os
import numpy as np
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent / "_shots"
DIR = ROOT / os.environ.get("IL_DIR", "inner")
m = json.loads((DIR / "manifest.json").read_text(encoding="utf-8"))
DPR = m["dpr"]

def analyze(it):
    a = np.asarray(Image.open(DIR / it["file"]).convert("RGB")).astype(np.float32)
    h, w = a.shape[:2]
    # 红线行
    red = (a[:, :, 0] > 170) & (a[:, :, 1] < 100) & (a[:, :, 2] < 100)
    rs = red.sum(axis=1)
    if rs.max() < w * 0.3:
        return None
    line_y = float(np.average(np.arange(h), weights=rs))   # 亚像素加权
    a = a.copy()
    a[red] = 255.0

    x0, x1 = int(w * 0.16), int(w * 0.84)
    win = a[:, x0:x1]
    q = (win // 8).reshape(-1, 3).astype(np.int32)
    u, c = np.unique(q, axis=0, return_counts=True)
    bg = u[c.argmax()].astype(np.float32) * 8 + 4
    dist = np.abs(win - bg).max(axis=2)
    hi = np.percentile(dist.ravel(), 99.5)
    if hi < 45:
        return None
    sel = win.reshape(-1, 3)[dist.ravel() >= hi * 0.9]
    fg = np.median(sel, axis=0)
    ink = np.abs(win - fg).sum(axis=2) < np.abs(win - bg).sum(axis=2)
    rows = ink.sum(axis=1)
    idx = np.where(rows >= max(1, win.shape[1] * 0.02))[0]
    if len(idx) < 2:
        return None
    t, b = idx[0], idx[-1]
    return {
        "text": it["name"], "fs": it["fs"], "h": it["h"],
        "inkH": (b - t + 1) / DPR,
        "gapT": (t - line_y) / DPR,          # 墨迹顶 到 红线
        "gapB": (line_y - b) / DPR,          # 红线 到 墨迹底
        "delta": ((t + b) / 2 - line_y) / DPR,
        "lineRel": line_y / h,               # 红线在图中位置（应 ≈0.5，用于校验）
    }

rows = [r for r in (analyze(it) for it in m["items"]) if r]
print(f"{'text':<10}{'fs':>5}{'h':>7}{'inkH':>7}{'gapT':>7}{'gapB':>7}{'delta':>8}{'line@':>8}")
print("-" * 66)
for r in sorted(rows, key=lambda r: -abs(r["delta"])):
    print(f"{r['text']:<10}{r['fs']:>5}{r['h']:>7.1f}{r['inkH']:>7.2f}{r['gapT']:>7.2f}"
          f"{r['gapB']:>7.2f}{r['delta']:>+8.2f}{r['lineRel']:>8.3f}")
if rows:
    print(f"\n中位 delta = {np.median([r['delta'] for r in rows]):+.2f}px")
    print(f"红线位置中位 = {np.median([r['lineRel'] for r in rows]):.3f}（应 ≈0.500）")
