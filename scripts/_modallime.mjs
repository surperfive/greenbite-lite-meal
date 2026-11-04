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
  const hsl = (r,gg,b) => { r/=255;gg/=255;b/=255; const mx=Math.max(r,gg,b),mn=Math.min(r,gg,b),l=(mx+mn)/2,dd=mx-mn; if(!dd) return [0,0,l]; const s=dd/(1-Math.abs(2*l-1)); let h; if(mx===r)h=((gg-b)/dd)%6; else if(mx===gg)h=(b-r)/dd+2; else h=(r-gg)/dd+4; return [(h*60+360)%360,s,l]; };
  const h = new Map();
  for (let i = 0; i < d.length; i += 4) {
    if (d[i+3] < 250) continue;
    const [hh, s, l] = hsl(d[i], d[i+1], d[i+2]);
    if (s < 0.25 || l < 0.2 || l > 0.95) continue;
    if (hh < 60 || hh > 95) continue;
    const k = d[i]+','+d[i+1]+','+d[i+2];
    h.set(k, (h.get(k)||0)+1);
  }
  return [...h.entries()].sort((a,b)=>b[1]-a[1]).slice(0,5).map(([k,n]) => ({ hex: '#'+k.split(',').map(v=>(+v).toString(16).padStart(2,'0')).join('').toUpperCase(), n, hsl: hsl(...k.split(',').map(Number)).map(v=>+v.toFixed(3)) }));
}, b64);
console.log(src);
for (const t of r) console.log(`  ${t.hex}  ${String(t.n).padStart(6)} px   H ${t.hsl[0]}° S ${t.hsl[1]} L ${t.hsl[2]}`);
await browser.close();
