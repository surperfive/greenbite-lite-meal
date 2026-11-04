"""改前 / 改后对比：照烧 + 酸奶两行，各两张（左=改前 blob2，右=改后 sz）"""
from PIL import Image, ImageDraw
PAIRS = [
    ('照烧锅', 'scripts/_shots/blob2-3-日式照烧鸡肉锅.png', 'scripts/_shots/sz/3.png'),
    ('酸奶杯', 'scripts/_shots/blob2-5-希腊酸奶杯.png',     'scripts/_shots/sz/5.png'),
]
CROP = (0, 0, 330, 330)
GAP = 12
tiles = []
for name, before, after in PAIRS:
    for p in (before, after):
        tiles.append((name, Image.open(p).convert('RGB').crop(CROP)))
W, H = tiles[0][1].size
sheet = Image.new('RGB', (W * 4 + GAP * 5, H + GAP * 2 + 40), (245, 246, 248))
d = ImageDraw.Draw(sheet)
for i, (name, t) in enumerate(tiles):
    x = GAP + i * (W + GAP)
    sheet.paste(t, (x, GAP))
    d.text((x + 6, H + GAP + 10), f'{name} {"改前" if i % 2 == 0 else "改后"}', fill=(40, 40, 40))
    if i % 2 == 1:
        d.line([(x - GAP // 2, 0), (x - GAP // 2, sheet.height)], fill=(200, 200, 200), width=3)
y_ref = GAP + int(0.835 * W)
d.line([(0, y_ref), (sheet.width, y_ref)], fill=(230, 0, 18), width=2)
sheet.save('scripts/_shots/size-before-after.png')
print('saved', sheet.size)
