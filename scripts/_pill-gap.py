# -*- coding: utf-8 -*-
"""直接量「墨迹上留白 vs 下留白」。
   对每颗胶囊：在【文字自己的横向范围】内取墨迹包围盒，
   gapT = 墨迹顶 − 胶囊顶，gapB = 胶囊底 − 墨迹底。
   居中 ⇔ gapT == gapB。delta = gapT − gapB（正 = 文字偏低）。
"""
import json, os, sys
import numpy as np
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent / "_shots"
DIR = ROOT / os.environ.get("PILL_DIR", "pills")
m = json.loads((DIR / "manifest.json").read_text(encoding="utf-8"))
DPR = m["dpr"]

cache = {}
def img_of(name):
    if name not in cache:
        cache[name] = np.asarray(Image.open(DIR / name).convert("RGB")).astype(np.int16)
    return cache[name]

def analyze(it):
    a = img_of(it["shot"])
    H, W = a.shape[:2]
    x0 = max(0, round(it["x"] * DPR)); y0 = max(0, round(it["y"] * DPR))
    x1 = min(W, round((it["x"] + it["w"]) * DPR)); y1 = min(H, round((it["y"] + it["h"]) * DPR))
    if x1 - x0 < 6 or y1 - y0 < 6:
        return None
    crop = a[y0:y1, x0:x1]
    h, w = crop.shape[:2]

    # 文字横向窗口（相对 crop），两侧各内缩 1px 避免描边
    tx0 = int(round((it["tx0"] - it["x"]) * DPR)); tx1 = int(round((it["tx1"] - it["x"]) * DPR))
    tx0 = max(1, min(w - 2, tx0)); tx1 = max(tx0 + 2, min(w - 1, tx1))
    win = crop[:, tx0:tx1]

    # 底色 = 窗口内出现最多的颜色（量化到 8 级）
    q = (win // 8).reshape(-1, 3)
    uniq, cnt = np.unique(q, axis=0, return_counts=True)
    dom = uniq[cnt.argmax()] * 8 + 4

    dist = np.abs(win.astype(np.int16) - dom.astype(np.int16)).max(axis=2)
    ink = dist > 60          # 阈值高一点，只取实心笔画，抗锯齿边缘不算
    rows = ink.sum(axis=1)
    idx = np.where(rows > 0)[0]
    if len(idx) < 2:
        return None
    t, b = idx[0], idx[-1]
    gapT = t / DPR
    gapB = (h - 1 - b) / DPR
    return {
        "text": it["text"], "fs": it["fs"], "h": it["h"], "icon": it["hasIcon"],
        "gapT": gapT, "gapB": gapB, "delta": gapT - gapB,
        "ink_h": (b - t + 1) / DPR,
    }

rows = [r for r in (analyze(it) for it in m["items"]) if r]

groups = {}
for r in rows:
    groups.setdefault((r["text"], round(r["h"])), []).append(r)

summ = []
for k, rs in groups.items():
    rs = sorted(rs, key=lambda r: r["delta"])
    mid = rs[len(rs) // 2]           # 取中位数那一颗，避开异常
    summ.append({**mid, "n": len(rs), "avg": float(np.median([r["delta"] for r in rs]))})

summ.sort(key=lambda r: -abs(r["avg"]))
TH = float(os.environ.get("TH", "0.4"))
print(f"胶囊种类 {len(summ)}；|gapT-gapB| ≥ {TH}px 的 {sum(1 for r in summ if abs(r['avg'])>=TH)} 种")
print(f"{'delta':>7} {'gapT':>6} {'gapB':>6} {'h':>5} {'fs':>5} {'ink':>5}  text")
print("-" * 76)
for r in summ:
    if abs(r["avg"]) < TH:
        continue
    print(f"{r['avg']:+7.2f} {r['gapT']:>6.2f} {r['gapB']:>6.2f} {r['h']:>5.0f} {r['fs']:>5.1f} "
          f"{r['ink_h']:>5.2f}  {r['text'][:18]}")

print()
print("=== 全部（按 delta 排序，正 = 文字偏低） ===")
for r in summ:
    print(f"{r['avg']:+7.2f}  fs={r['fs']:>5.1f} h={r['h']:>4.0f} n={r['n']:>2}  {r['text'][:20]}")
