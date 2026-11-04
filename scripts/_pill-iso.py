# -*- coding: utf-8 -*-
"""量隔离截图里文字的上下留白。

要点：
1. 底色 = 文字窗口内出现最多的颜色（量化 8 级取众数）。
2. 文字色 = 窗口内「离底色最远」那批像素的中位色 —— 不去解析 CSS 颜色
   （Tailwind v4 输出 oklch/oklab，解析不了）。
3. 分类器 = 离文字色近还是离底色近；抗锯齿像素落中间，上下偏置对称，
   在 delta = gapT − gapB 里相互抵消。
"""
import json, os, sys
import numpy as np
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent / "_shots"
DIR = ROOT / os.environ.get("ISO_DIR", "iso")
m = json.loads((DIR / "manifest.json").read_text(encoding="utf-8"))
DPR = m["dpr"]

cache = {}
def arr(f):
    if f not in cache:
        cache[f] = np.asarray(Image.open(DIR / f).convert("RGB")).astype(np.float32)
    return cache[f]

def analyze(it):
    a = arr(it["file"])
    h, w = a.shape[:2]
    tx0 = max(1, min(w - 3, int(round(it["tx0"] * DPR))))
    tx1 = max(tx0 + 3, min(w - 1, int(round(it["tx1"] * DPR))))
    win = a[:, tx0:tx1]
    if win.size == 0 or h < 8:
        return None

    q = (win // 8).reshape(-1, 3).astype(np.int32)
    uniq, cnt = np.unique(q, axis=0, return_counts=True)
    bg = uniq[cnt.argmax()].astype(np.float32) * 8 + 4

    dist = np.abs(win - bg).max(axis=2)
    flat = dist.ravel()
    hi = np.percentile(flat, 99.5)
    if hi < 40:
        return None
    sel = win.reshape(-1, 3)[flat >= hi * 0.9]
    fg = np.median(sel, axis=0)

    dt = np.abs(win - fg).sum(axis=2)
    db = np.abs(win - bg).sum(axis=2)
    ink = dt < db

    rows = ink.sum(axis=1)
    idx = np.where(rows >= 1)[0]
    if len(idx) < 2:
        return None
    keep = rows[idx] >= max(1, (tx1 - tx0) * 0.015)
    idx = idx[keep]
    if len(idx) < 2:
        return None
    t, b = idx[0], idx[-1]
    gapT = t / DPR
    gapB = (h - 1 - b) / DPR
    return {
        "text": it["text"], "fs": it["fs"], "h": it["hh"], "icon": it["icon"],
        "gapT": gapT, "gapB": gapB, "delta": gapT - gapB,
        "ink_h": (b - t + 1) / DPR, "file": it["file"],
    }

rows = [r for r in (analyze(it) for it in m["items"]) if r]
out = {f"{r['text']}|{round(r['h'])}": r for r in rows}

if "--json" in sys.argv:
    name = os.environ.get("ISO_DIR", "iso")
    (ROOT / f"gap-{name}.json").write_text(json.dumps(out, ensure_ascii=False), encoding="utf-8")
    print("json →", name, len(out))

byfs = {}
for r in rows:
    byfs.setdefault(r["fs"], []).append(r["delta"])

print(f"{'fs':>6} {'n':>3} {'median':>8} {'min':>7} {'max':>7}")
print("-" * 34)
for fs in sorted(byfs):
    v = np.array(byfs[fs])
    print(f"{fs:>6.1f} {len(v):>3} {np.median(v):>+8.2f} {v.min():>+7.2f} {v.max():>+7.2f}")

if "--all" in sys.argv:
    print()
    print(f"{'delta':>7} {'gapT':>6} {'gapB':>6} {'h':>5} {'fs':>5} {'ink':>5} ic  text")
    print("-" * 74)
    for r in sorted(rows, key=lambda r: (r["fs"], r["delta"])):
        print(f"{r['delta']:+7.2f} {r['gapT']:>6.2f} {r['gapB']:>6.2f} {r['h']:>5.0f} {r['fs']:>5.1f} "
              f"{r['ink_h']:>5.2f} {int(r['icon'])}  {r['text'][:22]}")
