import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const src = process.argv[2];
const mime = src.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
const b64 = `data:${mime};base64,${readFileSync(src).toString('base64')}`;
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage();
const r = await page.evaluate(async (src) => {
  const img = new Image(); img.src = src; await img.decode();
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
  c.getContext('2d').drawImage(img, 0, 0);
  const d = c.getContext('2d').getImageData(0, 0, img.width, img.height).data;
  const W = img.width, H = img.height;
  const lum = (x, y) => { const i = (y*W+x)*4; return 0.299*d[i]+0.587*d[i+1]+0.114*d[i+2]; };
  const rows = [];
  for (let y = 0; y < H; y += 6) {
    let L = -1, R = -1;
    for (let x = 0; x < W; x++) if (lum(x,y) < 120) { if (L < 0) L = x; R = x; }
    rows.push([y, L, R]);
  }
  return { W, H, rows };
}, b64);
console.log('y  left  right');
for (const [y, L, R] of r.rows) console.log(String(y).padStart(3), String(L).padStart(5), String(R).padStart(6));
await browser.close();
