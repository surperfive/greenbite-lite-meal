"""
量订单卡「实付 ¥xx」与左侧文字块的**墨迹**垂直关系。

为什么不能只看 DOM：价格块 19px / leading-none，数字字形在行盒里天然偏上，
而左侧是「13px 标题 + 11px 时间戳」两行。盒子中心可以对齐，墨迹重心却差 3-4px
—— 用户看到的"偏高"是墨迹，不是盒子。

做法：
1. 只在**右侧价格列**（x > 图宽 62%）里找品牌粉像素，按 y 连续段聚类，取第一组；
2. 以它的 y 范围为锚，在**文字列**（缩略图右侧 ~ 价格左侧）里找近黑（标题）
   与 #5B6472（时间戳）；
3. 输出三者中心与差值。

用法：python scripts/_diag_price_ink.py <png>
"""
from PIL import Image
import sys

path = sys.argv[1]
im = Image.open(path).convert("RGB")
W, H = im.size
px = im.load()

PRICE_X0 = int(W * 0.62)   # 价格列左边界
TEXT_X0 = int(W * 0.24)    # 文字列左边界（缩略图右侧）
TEXT_X1 = PRICE_X0 - 6


def near_black(c):
    return c[0] < 70 and c[1] < 70 and c[2] < 70


def is_pink(c):
    return c[0] > 190 and c[1] < 120 and 110 < c[2] < 200


def near_meta(c):
    return abs(c[0] - 91) < 30 and abs(c[1] - 100) < 30 and abs(c[2] - 114) < 30


def rows_with(pred, x0, x1):
    """返回每一行是否含目标像素。"""
    out = []
    for y in range(H):
        hit = False
        for x in range(x0, x1):
            if pred(px[x, y]):
                hit = True
                break
        out.append(hit)
    return out


def clusters(flags, min_gap=6):
    """把为 True 的行聚成连续段，允许 min_gap 行的空隙。"""
    spans, start, last = [], None, None
    for y, f in enumerate(flags):
        if f:
            if start is None:
                start = y
            last = y
        elif start is not None and y - last > min_gap:
            spans.append((start, last))
            start = None
    if start is not None:
        spans.append((start, last))
    return spans


def bbox(pred, x0, x1, y0, y1):
    mnx, mny, mxx, mxy, n = 10**9, 10**9, -1, -1, 0
    for y in range(y0, min(y1, H)):
        for x in range(x0, min(x1, W)):
            if pred(px[x, y]):
                n += 1
                mnx = min(mnx, x); mxx = max(mxx, x)
                mny = min(mny, y); mxy = max(mxy, y)
    if mxx < 0:
        return None
    return dict(x0=mnx, y0=mny, x1=mxx, y1=mxy, w=mxx - mnx + 1, h=mxy - mny + 1, n=n)


price_spans = clusters(rows_with(is_pink, PRICE_X0, W), min_gap=8)
if not price_spans:
    print("no price pixels in right column")
    sys.exit(1)

print(f"image {W}x{H}  price column x>={PRICE_X0}, text column {TEXT_X0}-{TEXT_X1}")
print(f"pink row clusters: {price_spans[:6]}")

for idx, (y0, y1) in enumerate(price_spans[:2]):
    red = bbox(is_pink, PRICE_X0, W, y0 - 2, y1 + 2)
    if not red:
        continue
    red_cy = (red["y0"] + red["y1"]) / 2

    band0, band1 = y0 - 40, y1 + 24
    title = bbox(near_black, TEXT_X0, TEXT_X1, band0, band1)
    meta = bbox(near_meta, TEXT_X0, TEXT_X1, band0, band1)

    print(f"\n--- 第 {idx + 1} 组价格 ---")
    print(f"PRICE ink y[{red['y0']}-{red['y1']}] center={red_cy:.1f} h={red['h']}")
    if title:
        print(f"TITLE ink y[{title['y0']}-{title['y1']}] center={(title['y0'] + title['y1']) / 2:.1f} h={title['h']}")
    if meta:
        print(f"META  ink y[{meta['y0']}-{meta['y1']}] center={(meta['y0'] + meta['y1']) / 2:.1f} h={meta['h']}")
    if title and meta:
        block_cy = (title["y0"] + meta["y1"]) / 2
        d = red_cy - block_cy
        print(f"text block y[{title['y0']}-{meta['y1']}] center={block_cy:.1f}")
        print(f"-> price - block = {d:+.1f}px  (DPR3, 即 CSS {d / 3:+.2f}px)")
        print("   负数 = 价格墨迹偏高，需要向下移动 |d|")
