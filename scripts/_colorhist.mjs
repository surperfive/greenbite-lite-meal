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
  const g = c.getContext('2d'); g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, img.width, img.height).data;
  const W = img.width, H = img.height;
  const rgb2hsl = (r, gg, b) => {
    r/=255; gg/=255; b/=255;
    const mx = Math.max(r,gg,b), mn = Math.min(r,gg,b), l = (mx+mn)/2, dd = mx-mn;
    if (!dd) return [0,0,l];
    const s = dd / (1 - Math.abs(2*l-1));
    let h; if (mx===r) h = ((gg-b)/dd) % 6; else if (mx===gg) h = (b-r)/dd + 2; else h = (r-gg)/dd + 4;
    return [(h*60+360)%360, s, l];
  };
  const buckets = new Map();
  for (let i = 0; i < d.length; i += 4) {
    const [h, s, l] = rgb2hsl(d[i], d[i+1], d[i+2]);
    if (s < 0.30 || l < 0.06 || l > 0.97) continue;
    const key = Math.round(h / 5) * 5;
    if (!buckets.has(key)) buckets.set(key, { n: 0, ls: 0 });
    const b = buckets.get(key); b.n++; b.ls += l;
  }
  const arr = [...buckets.entries()].map(([h, v]) => ({ hue: h, n: v.n, avgL: +(v.ls/v.n).toFixed(2) })).sort((a,b) => b.n - a.n).slice(0, 12);
  return { W, H, arr };
}, b64);
console.log(`=== ${src}  ${r.W}x${r.H} ===`);
console.log('色相区间  n像素  平均亮度');
for (const b of r.arr) console.log(`${String(b.hue).padStart(4)}°  ${String(b.n).padStart(8)}  ${b.avgL}`);
await browser.close();
