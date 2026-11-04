# -*- coding: utf-8 -*-
"""把用户给的 10 款食材大图拆成 10 张透明 PNG。

原图 1254x1254、2 行 5 列、纯白底 (255,255,255)。

⚠️ 不能按均匀网格切：列投影显示第 3、4 个食材（鸡胸肉 / 豆腐）连在一起，
   按 1254/5 硬切会把豆腐右边切掉 13px。所以走连通域。

关键点：豆腐、蛋清本身是白色的，**不能**用「非白即前景」的全局阈值，
否则食材内部会被掏空。做法是先闭运算 + 填内部孔洞，再取连通域。
"""
import os
import re
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

SRC = r'C:\Users\kccog\.workbuddy-ai\clipboard-images\clipboard-2026-10-12T15-59-56-944Z-bf8961e7.jpg'
OUT_DIR = 'public/ingredients'
CANVAS = 320          # 输出画布边长
MAX_SIDE = 300        # 食材最长边缩放到的像素
WHITE_CUT = 240       # 任一通道低于此值即视为「非白」

# 与 mockData 的 GACHA_INGREDIENTS 顺序一一对应（先上排左→右，再下排左→右）
ORDER = [
    'ing_steak',    # 安格斯牛排
    'ing_prawn',    # 黑虎虾串
    'ing_chicken',  # 黑椒鸡胸肉
    'ing_tofu',     # 高纤嫩豆腐
    'ing_egg',      # 溏心水波蛋
    'ing_quinoa',   # 藜麦糙米饭
    'ing_kale',     # 羽衣甘蓝
    'ing_tomato',   # 多汁圣女果
    'ing_broccoli', # 高纤西兰花
    'ing_edamame',  # 日式毛豆仁
]

im = Image.open(SRC).convert('RGB')
a = np.asarray(im)
print(f'源图 {im.size[0]}x{im.size[1]}')

# ① 前景掩码：非白 → 闭运算补描边缺口 → 填内部孔洞（保住豆腐/蛋清的白色）
nonwhite = (a < WHITE_CUT).any(axis=2)
closed = ndimage.binary_closing(nonwhite, structure=np.ones((3, 3), bool))
solid = ndimage.binary_fill_holes(closed)

# ② 连通域
lab, n = ndimage.label(solid)
sizes = ndimage.sum(solid, lab, index=np.arange(1, n + 1))
print(f'连通域 {n} 个，面积前 12：{[int(s) for s in np.sort(sizes)[::-1][:12]]}')

# ③ 取面积最大的 10 个
keep = np.argsort(sizes)[::-1][:10] + 1
boxes = []
for l in keep:
    ys, xs = np.where(lab == l)
    boxes.append({'label': l, 'x0': int(xs.min()), 'x1': int(xs.max()),
                  'y0': int(ys.min()), 'y1': int(ys.max()), 'area': int(sizes[l - 1])})

if len(boxes) != 10:
    sys.exit(f'❌ 只找到 {len(boxes)} 个连通域，应为 10 —— 阈值需要调整')

# ④ 排序：先按 y 中心分两行，行内按 x 中心
cy = sorted(b['y0'] for b in boxes)
row_split = (cy[0] + cy[-1]) / 2
for b in boxes:
    b['cy'] = (b['y0'] + b['y1']) / 2
    b['cx'] = (b['x0'] + b['x1']) / 2
boxes.sort(key=lambda b: (0 if b['cy'] < row_split else 1, b['cx']))

# ⑤ 逐个裁出、去背景、缩放、居中
os.makedirs(OUT_DIR, exist_ok=True)
rgba = np.dstack([a, np.full(a.shape[:2], 255, np.uint8)])

for ing_id, b in zip(ORDER, boxes):
    sub_rgba = rgba[b['y0']:b['y1'] + 1, b['x0']:b['x1'] + 1].copy()
    sub_lab = lab[b['y0']:b['y1'] + 1, b['x0']:b['x1'] + 1]
    # 域外像素透明；域内保留原色（含白色内部）
    sub_rgba[..., 3] = np.where(sub_lab == b['label'], 255, 0).astype(np.uint8)

    img = Image.fromarray(sub_rgba, 'RGBA')
    w, h = img.size
    k = MAX_SIDE / max(w, h)
    img = img.resize((max(1, round(w * k)), max(1, round(h * k))), Image.LANCZOS)

    canvas = Image.new('RGBA', (CANVAS, CANVAS), (0, 0, 0, 0))
    canvas.paste(img, ((CANVAS - img.size[0]) // 2, (CANVAS - img.size[1]) // 2), img)
    path = f'{OUT_DIR}/{ing_id}.png'
    canvas.save(path, optimize=True)

    print(f'  {ing_id:<14} 源 bbox {b["x1"]-b["x0"]+1:>3}x{b["y1"]-b["y0"]+1:<3} '
          f'面积 {b["area"]:>6}  → {path}')

print(f'\n✅ 输出 {len(ORDER)} 张到 {OUT_DIR}/')
