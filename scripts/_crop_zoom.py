"""裁出订单卡「价格 + 左侧文字」区域并放大，用于目视校准。"""
from PIL import Image
import sys

src, out = sys.argv[1], sys.argv[2]
box = tuple(int(v) for v in sys.argv[3:7])   # left top right bottom（原图像素）
scale = int(sys.argv[7]) if len(sys.argv) > 7 else 2

im = Image.open(src).convert("RGB")
crop = im.crop(box)
crop = crop.resize((crop.width * scale, crop.height * scale), Image.LANCZOS)
crop.save(out)
print(f"{out} {crop.width}x{crop.height}")
