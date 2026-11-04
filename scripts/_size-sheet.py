"""六张商品卡的缩略图并排拼图（3x 截图 → 裁左侧缩略图区 → 横排 + 底边参考线）。

改 DishCoverArt 的 THUMB_FRAME 后用它目视"大小是否一致"，比单卡目测可靠。
用法：python scripts/_size-sheet.py [输出名]
"""
import sys, os
from PIL import Image, ImageDraw

SRC = 'scripts/_shots/sz'
OUT = sys.argv[1] if len(sys.argv) > 1 else 'scripts/_shots/size-check.png'
NAMES = ['沙拉', '三明治', '奶昔', '照烧', '拿铁', '酸奶']

imgs = [Image.open(os.path.join(SRC, f'{i}.png')).convert('RGB') for i in range(6)]
# 卡片 3x = 810×366；缩略图 300×300，卡片 p-2.5 = 7.5px(2.5x) → 3x 下 30px 内边距
CROP = (0, 0, 330, 330)   # 缩略图 + 左侧/上侧内边距
tiles = [im.crop(CROP) for im in imgs]

W, H = tiles[0].size
GAP = 10
sheet = Image.new('RGB', (W * 6 + GAP * 7, H + GAP * 2 + 34), (245, 246, 248))
d = ImageDraw.Draw(sheet)
for i, t in enumerate(tiles):
    x = GAP + i * (W + GAP)
    sheet.paste(t, (x, GAP))
    d.text((x + 6, H + GAP + 8), NAMES[i], fill=(60, 60, 60))
# 底边参考线：食物底边 83.5%（容器 100 → 3x 缩略图 300 高）
y_ref = GAP + int(0.835 * W)
d.line([(0, y_ref), (sheet.width, y_ref)], fill=(230, 0, 18), width=2)
sheet.save(OUT)
print('saved', OUT, sheet.size)
