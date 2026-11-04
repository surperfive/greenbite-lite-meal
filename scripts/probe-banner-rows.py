"""逐行统计海报里「有内容」的像素比例，用来决定上下各裁多少。

判据：与底色 (174,232,23) 的 RGB 曼哈顿差 > 24 视为内容像素。
输出每 4 行一条，便于看留白分布。
"""
import sys
from PIL import Image

path = sys.argv[1] if len(sys.argv) > 1 else "public/ordering_header_banner.png"
im = Image.open(path).convert("RGB")
W, H = im.size
px = im.load()
BG = (174, 232, 23)

rows = []
for y in range(H):
    n = 0
    for x in range(0, W, 2):
        r, g, b = px[x, y]
        if abs(r - BG[0]) + abs(g - BG[1]) + abs(b - BG[2]) > 24:
            n += 1
    rows.append(n / (W / 2))

first = next(i for i, v in enumerate(rows) if v > 0.005)
last = max(i for i, v in enumerate(rows) if v > 0.005)

out = [f"size={W}x{H}", f"firstContentRow={first}  lastContentRow={last}",
       f"blankTop={first}  blankBottom={H - 1 - last}", "row  ratio"]
for y in range(0, H, 4):
    out.append(f"{y:>4}  {rows[y]:.3f}  " + "#" * int(rows[y] * 40))

open("outputs/banner-rows.txt", "w", encoding="utf-8").write("\n".join(out))
print("ok")
