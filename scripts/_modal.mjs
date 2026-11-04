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
  const gg = c.getContext('2d'); gg.drawImage(img, 0, 0);
  const d = gg.getImageData(0, 0, img.width, img.height).data;
  const h = new Map();
  for (let i = 0; i < d.length; i += 4) {
    if (d[i+3] < 250) continue;
    const k = d[i]+','+d[i+1]+','+d[i+2];
    h.set(k, (h.get(k)||0)+1);
  }
  const top = [...h.entries()].sort((a,b)=>b[1]-a[1]).slice(0,6);
  return top.map(([k,n]) => ({ hex: '#'+k.split(',').map(v=>(+v).toString(16).padStart(2,'0')).join('').toUpperCase(), n }));
}, b64);
console.log(src);
for (const t of r) console.log(`  ${t.hex}  ${t.n} px`);
await browser.close();
