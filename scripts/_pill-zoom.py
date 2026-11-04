# -*- coding: utf-8 -*-
"""把胶囊按 8× 放大排成对照表，画上胶囊的水平中心线（红）与垂直中心线（青），
   纯目视判断「文字是否在胶囊里居中」，不依赖任何阈值/质心。"""
import json, os, sys
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent / "_shots"
DIR = ROOT / os.environ.get("PILL_DIR", "pills")
OUT = ROOT / os.environ.get("SHEET_OUT", "pill-zoom.png")
SC = int(os.environ.get("SHEET_SC", "8"))

m = json.loads((DIR / "manifest.json").read_text(encoding="utf-8"))
DPR = m["dpr"]

want = [
    ("外卖", None), ("自提", None), ("到店自取", None),
    ("全部(2)", None), ("≤250大卡", None), ("首单立减", None), ("高蛋白", None),
    ("进行中(1)", None), ("去评价", None), ("再来一单", None), ("配送中", None),
    ("查看更多", None), ("立省¥35", None), ("立即登录", None),
    ("加入购物车", None), ("立即购买", None), ("去结算", None),
    ("共 2 件", None), ("已抵扣", None), ("退出登录 / 切换账号", None),
    ("限时超值福利", None), ("开启元气营养轻食生活", None), ("黄金会员", None),
]
seen = {}
for it in m["items"]:
    t = it["text"]
    for w, _ in want:
        if t.startswith(w) and w not in seen:
            seen[w] = it

picked = [(w, seen[w]) for w, _ in want if w in seen]
print("命中", len(picked), "/", len(want))

PADX, PADY, LBL = 14, 12, 24
COLS = int(os.environ.get("SHEET_COLS", "2"))
tiles = []
for w, it in picked:
    x0 = round(it["x"] * DPR); y0 = round(it["y"] * DPR)
    ww = round(it["w"] * DPR); hh = round(it["h"] * DPR)
    img = Image.open(DIR / it["shot"]).convert("RGB").crop((x0, y0, x0 + ww, y0 + hh))
    maxw = 118 * SC // 2
    if img.width > maxw:
        cx = img.width // 2
        img = img.crop((cx - maxw // 2, 0, cx + maxw // 2, img.height))
    img = img.resize((img.width * SC // 2, img.height * SC // 2), Image.LANCZOS)
    tiles.append((w, it, img))

cw = max(t[2].width for t in tiles) + PADX * 2
rh = max(t[2].height for t in tiles) + LBL + PADY
rows = (len(tiles) + COLS - 1) // COLS
sheet = Image.new("RGB", (cw * COLS, rh * rows), (252, 252, 252))
d = ImageDraw.Draw(sheet)
for k, (w, it, img) in enumerate(tiles):
    ox = (k % COLS) * cw + PADX
    oy = (k // COLS) * rh + PADY
    sheet.paste(img, (ox, oy + LBL))
    cy = oy + LBL + img.height // 2
    cx = ox + img.width // 2
    d.line([(ox - 8, cy), (ox + img.width + 8, cy)], fill=(255, 0, 0), width=2)
    d.line([(cx, oy + LBL - 5), (cx, oy + LBL + img.height + 5)], fill=(0, 170, 255), width=2)
    d.text((ox, oy + 5), f"{w}  h={it['h']:.0f} fs={it['fs']:.1f} ic={int(it['hasIcon'])}", fill=(0, 0, 0))
sheet.save(OUT)
print("->", OUT, sheet.size)
