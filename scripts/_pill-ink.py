"""
量每颗胶囊里文字的**真实墨迹中心**，与胶囊几何中心比较。

用法：python scripts/_pill-ink.py [--all] [--sheet]

输入 scripts/_shots/pills/manifest.json（由 _pill-shots.mjs 产出）
逻辑：
  ① 按 pill 矩形裁图（3× DPR）；
  ② **只在文字自己的行盒窗口里**取众数色当底色 —— 模式切换的白色滑块、
     图标、渐变底都不会污染（这是第一版量出「外卖 0.00 / 自提 +1.50」假数据的原因）；
  ③ 与底色通道差 > 40 的像素 = 墨迹；
  ④ 墨迹 bbox 中心 − 裁切框中心 = 偏移（正 = 偏下）；
  ⑤ inkH / fontSize 落在 0.8~1.35 之外判为测量污染，剔除后再取平均。
"""
import json
import sys
from collections import Counter
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent
import os
DIR = ROOT / "_shots" / os.environ.get("PILL_DIR", "pills")
MAN = json.loads((DIR / "manifest.json").read_text(encoding="utf-8"))
DPR = MAN["dpr"]
ITEMS = MAN["items"]

DIFF = 40                 # 墨迹判定阈值
RATIO_OK = (0.80, 1.35)   # inkH / fontSize 合理区间


def dominant(arr):
    q = (arr // 8) * 8
    flat = q.reshape(-1, 3)
    c = Counter(map(tuple, flat))
    return np.array(c.most_common(1)[0][0], dtype=np.int16)


def measure(it, img):
    x0 = round(it["x"] * DPR)
    y0 = round(it["y"] * DPR)
    w = round(it["w"] * DPR)
    h = round(it["h"] * DPR)
    if w < 6 or h < 6:
        return None

    # 文字行盒窗口（相对 pill 左上角，设备像素）
    wx0 = max(0, round((it["tx0"] - it["x"]) * DPR) - 1)
    wx1 = min(w, round((it["tx1"] - it["x"]) * DPR) + 1)
    wy0 = max(0, round((it["ty0"] - it["y"]) * DPR) - 1)
    wy1 = min(h, round((it["ty1"] - it["y"]) * DPR) + 1)
    if wx1 - wx0 < 6 or wy1 - wy0 < 6:
        return None

    win = np.asarray(
        img.crop((x0 + wx0, y0 + wy0, x0 + wx1, y0 + wy1)).convert("RGB")
    ).astype(np.int16)
    dom = dominant(win)
    mask = np.abs(win - dom).max(axis=2) > DIFF
    # 窗口边缘 1px 可能是相邻元素，去掉
    mask[:1, :] = False
    mask[-1:, :] = False
    mask[:, :1] = False
    mask[:, -1:] = False

    # 亚像素质心：用「与底色的距离」当权重，比阈值包围盒稳得多
    wgt = np.abs(win - dom).max(axis=2).astype(np.float64)
    wgt[wgt < 8] = 0
    wgt[:1, :] = 0
    wgt[-1:, :] = 0
    wgt[:, :1] = 0
    wgt[:, -1:] = 0
    rows = wgt.sum(axis=1)
    cols = wgt.sum(axis=0)
    if rows.sum() <= 0:
        return None
    cy_rel = float((rows * np.arange(len(rows))).sum() / rows.sum())
    cx_rel = float((cols * np.arange(len(cols))).sum() / cols.sum())

    ys = np.where(rows > 0)[0]
    ink_h = (ys[-1] - ys[0] + 1) / DPR if len(ys) else 0
    abs_y = wy0 + cy_rel
    abs_x = wx0 + cx_rel
    off = (abs_y - (h - 1) / 2) / DPR
    offx = (abs_x - (w - 1) / 2) / DPR
    fs = it["fs"]
    ratio = ink_h / fs if fs else 0

    return {
        "off": off,
        "offx": offx,
        "ink_h": ink_h,
        "ratio": ratio,
        "susp": not (RATIO_OK[0] <= ratio <= RATIO_OK[1]),
        "ink_y0": (abs_y - ink_h * DPR / 2) / DPR,
        "ink_y1": (abs_y + ink_h * DPR / 2) / DPR,
        "h": h / DPR,
        "w": w / DPR,
        "crop": (x0, y0, w, h),
    }


rows = []
cache = {}
for it in ITEMS:
    p = DIR / it["shot"]
    if p not in cache:
        cache[p] = Image.open(p)
    m = measure(it, cache[p])
    if m:
        rows.append({**it, **m})

# 按「文本 + 高度 + 字号 + 有无图标」归并
groups = {}
for r in rows:
    k = (r["text"], round(r["h"]), round(r["fs"], 1), r["hasIcon"])
    groups.setdefault(k, []).append(r)

summ = []
for k, rs in groups.items():
    clean = [r for r in rs if not r["susp"]] or rs
    summ.append({
        **rs[0],
        "n": len(rs),
        "avg": sum(r["off"] for r in clean) / len(clean),
        "avgx": sum(r["offx"] for r in clean) / len(clean),
        "clean": len(clean),
        "susp_all": all(r["susp"] for r in rs),
    })

if "--json" in sys.argv:
    out = {f"{r['text']}|{round(r['h'])}|{r['fs']}": round(r["avg"], 2) for r in summ}
    name = os.environ.get("PILL_DIR", "pills")
    (ROOT / "_shots" / f"off-{name}.json").write_text(json.dumps(out, ensure_ascii=False), encoding="utf-8")
    print("json →", name)

summ.sort(key=lambda r: -abs(r["avg"]))
THRESH = 0.0 if "--all" in sys.argv else 0.6
bad = [r for r in summ if abs(r["avg"]) >= THRESH]

print(f"胶囊种类 {len(summ)}，实例 {len(rows)}；|平均偏移| ≥ {THRESH}px 的 {len(bad)} 种\n")
print(f"{'avgY':>7} {'avgX':>7} {'n':>3} {'h':>6} {'fs':>5} {'inkH':>6} {'r':>5}  text")
print("-" * 84)
for r in bad:
    flag = "⚠️" if r["susp_all"] else "  "
    print(
        f"{r['avg']:+7.2f} {r['avgx']:+7.2f} {r['clean']:>3} {r['h']:>6.1f} {r['fs']:>5.1f} "
        f"{r['ink_h']:>6.2f} {r['ratio']:>5.2f} {flag} «{r['text']}»"
    )

if "--sheet" in sys.argv:
    SC = 8
    PADX, PADY = 14, 12
    LABEL = 30
    sel = [r for r in summ if not r["susp_all"]][:16]
    tiles = []
    for r in sel:
        x0, y0, w, h = r["crop"]
        img = cache[DIR / r["shot"]].crop((x0, y0, x0 + w, y0 + h)).convert("RGB")
        img = img.resize((w * SC, h * SC), Image.LANCZOS)
        tiles.append((r, img))
    tw = max(t[1].width for t in tiles) + PADX * 2
    th = sum(t[1].height + LABEL + PADY for t in tiles) + PADY
    sheet = Image.new("RGB", (tw + 210, th), (250, 250, 250))
    d = ImageDraw.Draw(sheet)
    y = PADY
    for r, img in tiles:
        sheet.paste(img, (PADX, y + LABEL))
        cx = PADX + img.width // 2
        cy = y + LABEL + img.height // 2
        d.line([(PADX - 8, cy), (PADX + img.width + 8, cy)], fill=(255, 0, 0), width=2)
        iy = y + LABEL + int(r["ink_y0"] * DPR * SC)
        ib = y + LABEL + int(r["ink_y1"] * DPR * SC)
        d.line([(PADX, iy), (PADX + img.width, iy)], fill=(0, 150, 255), width=2)
        d.line([(PADX, ib), (PADX + img.width, ib)], fill=(0, 150, 255), width=2)
        d.text((PADX, y + 8), f"{r['avg']:+.2f}px   h={r['h']:.1f}  fs={r['fs']:.1f}", fill=(0, 0, 0))
        d.text((PADX + img.width + 10, cy - 6), f"«{r['text']}»", fill=(0, 0, 0))
        y += img.height + LABEL + PADY
    out = ROOT / "_shots" / "pill-sheet.png"
    sheet.save(out)
    print(f"\n对照图 → {out}")
