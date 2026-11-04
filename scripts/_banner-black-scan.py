import numpy as np
from PIL import Image
im = np.array(Image.open("public/ordering_header_banner.png").convert("RGB")).astype(int)
h, w, _ = im.shape
print("size:", w, "x", h)
# 逐行统计：暗像素占比 (max channel < 80) 与行内 std
for y in range(h-1, 300, -1):
    row = im[y]
    dark = (row.max(axis=1) < 80).mean()
    std = row.std()
    if y >= h-50 or dark > 0.001:
        print(f"y={y} dark={dark:.3f} std={std:.1f} mean={row.mean(axis=0).astype(int)}")
