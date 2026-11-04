# -*- coding: utf-8 -*-
"""标定图测量：红线 = 胶囊垂直中心（已知绝对参照）。
   对每格算墨迹中心相对红线的偏移 delta（正 = 文字偏低）。
   同一颗胶囊有 5 个已知位移，用它自校验：delta(+1) − delta(0) 应 ≈ +1px。
"""
import json
import numpy as np
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent / "_shots" / "calib"
m = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))
SH = m["shifts"]
DPR = 4

def ink_of(img):
    a = np.asarray(img.convert("RGB")).astype(np.float32)
    h, w = a.shape[:2]
    # 去掉红线：纯红且饱和
    red = (a[:, :, 0] > 180) & (a[:, :, 1] < 90) & (a[:, :, 2] < 90)
    rows_red = red.sum(axis=1)
    line_y = int(np.argmax(rows_red)) if rows_red.max() > 0 else h // 2
    a = a.copy()
    a[red] = 255.0

    q = (a // 8).reshape(-1, 3).astype(np.int32)
    uniq, cnt = np.unique(q, axis=0, return_counts=True)
    bg = uniq[cnt.argmax()].astype(np.float32) * 8 + 4
    dist = np.abs(a - bg).max(axis=2)
    hi = np.percentile(dist.ravel(), 99.5)
    if hi < 40:
        return None, line_y
    sel = a.reshape(-1, 3)[dist.ravel() >= hi * 0.9]
    fg = np.median(sel, axis=0)
    dt = np.abs(a - fg).sum(axis=2)
    db = np.abs(a - bg).sum(axis=2)
    ink = dt < db
    rows = ink.sum(axis=1)
    idx = np.where(rows >= max(1, w * 0.01))[0]
    if len(idx) < 2:
        return None, line_y
    t, b = idx[0], idx[-1]
    return ((t + b) / 2 - line_y) / DPR, line_y

print(f"{'text':<16}{'fs':>5}{'h':>5} | " + " ".join(f"{s:+d}".rjust(7) for s in SH) + "  | 线性校验")
print("-" * 96)
rows = []
for it in m["items"]:
    img = Image.open(ROOT / it["file"])
    w = img.width
    cell = w // len(SH)
    ds = []
    for k in range(len(SH)):
        sub = img.crop((k * cell, 0, (k + 1) * cell, img.height))
        d, ly = ink_of(sub)
        ds.append(d)
    if any(d is None for d in ds):
        print(f"{it['t'][:15]:<16}{it['fs']:>5}{it['h']-20:>5.0f} |  测量失败")
        continue
    lin = ds[3] - ds[2]     # +1 档 - 0 档
    rows.append({"t": it["t"], "fs": it["fs"], "h": it["h"] - 20, "ds": ds, "lin": lin})
    print(f"{it['t'][:15]:<16}{it['fs']:>5}{it['h']-20:>5.0f} | " +
          " ".join(f"{d:>+7.2f}" for d in ds) + f"  |  {lin:+.2f}")

print()
print("=== 按 0 档 delta 判断需要往下移多少（= -delta） ===")
for r in rows:
    d0 = r["ds"][2]
    print(f"  {r['t'][:14]:<15} fs={r['fs']:>4} h={r['h']:>3.0f}  delta0={d0:+6.2f}px  → 需位移 {-d0:+5.2f}px  (em {-d0/r['fs']:+6.3f})")
