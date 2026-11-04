import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const p = process.argv[2];
const b64 = `data:image/jpeg;base64,${readFileSync(p).toString('base64')}`;
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage();
const r = await page.evaluate(async (src) => {
  const img = new Image();
  img.src = src;
  await img.decode();
  const c = document.createElement('canvas');
  c.width = img.width; c.height = img.height;
  const g = c.getContext('2d');
  g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, img.width, img.height).data;
  const W = img.width, H = img.height;
  // 四角取样
  const at = (x, y) => { const i = (y * W + x) * 4; return [d[i], d[i+1], d[i+2]]; };
  const corners = [at(4,4), at(W-5,4), at(4,H-5), at(W-5,H-5), at(W>>1,4)];
  // 背景色取中位数
  const bg = corners[0];
  // 内容包围盒：与 bg 差异 > 40 的像素
  let x0=W, x1=-1, y0=H, y1=-1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const [r_,g_,b_] = at(x,y);
    if (Math.abs(r_-bg[0])+Math.abs(g_-bg[1])+Math.abs(b_-bg[2]) > 90) {
      if (x<x0)x0=x; if(x>x1)x1=x; if(y<y0)y0=y; if(y>y1)y1=y;
    }
  }
  const hex = (c) => '#' + c.map(v=>v.toString(16).padStart(2,'0')).join('').toUpperCase();
  return { W, H, ratio: +(W/H).toFixed(3), bg: hex(bg), corners: corners.map(hex),
    content: { x0, y0, x1, y1, w: x1-x0+1, h: y1-y0+1,
      leftPct: +(x0/W*100).toFixed(1), rightPct: +(x1/W*100).toFixed(1),
      topPct: +(y0/H*100).toFixed(1), bottomPct: +(y1/H*100).toFixed(1) } };
}, b64);
console.log(JSON.stringify(r, null, 2));
await browser.close();
