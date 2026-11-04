from PIL import Image
im = Image.open('scripts/_shots/crown-ab.png')
W,H = im.size
print('full', W, H)
# 四行大致均分，每行裁出徽章区（x 280..790），再 2x 放大
rows = [(0,180),(180,355),(355,530),(530,700)]
outs=[]
for i,(a,b) in enumerate(rows):
    c = im.crop((280, a+8, 790, b-8)).resize((510*2, (b-a-16)*2), Image.LANCZOS)
    outs.append(c)
w = max(o.width for o in outs); h = sum(o.height for o in outs)
canvas = Image.new('RGB',(w,h),'white')
y=0
for o in outs:
    canvas.paste(o,(0,y)); y+=o.height
canvas.save('scripts/_shots/crown-ab-zoom.png')
print('saved', canvas.size)
