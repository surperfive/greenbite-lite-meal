import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const src = process.argv[2];
const cols = process.argv.slice(3).map(Number);
const mime = src.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
const b64 = `data:${mime};base64,${readFileSync(src).toString('base64')}`;
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage();
const r = await page.evaluate(async ([src, cols]) => {
  const img = new Image(); img.src = src; await img.decode();
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
  const g = c.getContext('2d'); g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, img.width, img.height).data;
  const W = img.width, H = img.height;
  const lum = (x, y) => { const i = (y*W+x)*4; return 0.299*d[i]+0.587*d[i+1]+0.114*d[i+2]; };
  const out = {};
  for (const x of cols) {
    let T = -1, B = -1;
    for (let y = 0; y < H; y++) if (lum(x,y) < 120) { if (T < 0) T = y; B = y; }
    out[x] = [T, B];
  }
  return out;
}, [b64, cols]);
for (const [x, [t, b]] of Object.entries(r)) console.log('x=' + x, 'top', t, 'bottom', b);
await browser.close();
