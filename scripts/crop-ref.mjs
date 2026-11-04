/**
 * 通用裁切放大：从参考图里裁一块出来放大，带 5px 细网格 + 25px 标注。
 * 用法：node scripts/crop-ref.mjs x y w h z outName
 */
import { chromium } from 'playwright';
import { readFileSync, mkdirSync } from 'node:fs';

const [x, y, w, h, z, name] = process.argv.slice(2);
const OUT = 'outputs/entry-ref-measure';
mkdirSync(OUT, { recursive: true });
const b64 = `data:image/png;base64,${readFileSync(process.env.CROP_FILE ?? 'outputs/entry-ref.png').toString('base64')}`;

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 1 });
await page.setContent('<!doctype html><html><body style="margin:0;background:#111"></body></html>');

await page.evaluate(async ([src, x, y, w, h, Z]) => {
  const img = await new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = src; });
  const cv = document.createElement('canvas');
  cv.width = w * Z; cv.height = h * Z;
  cv.style.cssText = `width:${w * Z}px;height:${h * Z}px;display:block`;
  document.body.appendChild(cv);
  const g = cv.getContext('2d');
  g.imageSmoothingEnabled = false;
  g.drawImage(img, x, y, w, h, 0, 0, w * Z, h * Z);
  g.font = '10px monospace';
  for (let gx = 0; gx <= w; gx += 5) {
    const big = (x + gx) % 25 === 0;
    g.strokeStyle = big ? 'rgba(255,0,0,0.8)' : 'rgba(255,0,0,0.22)';
    g.beginPath(); g.moveTo(gx * Z + 0.5, 0); g.lineTo(gx * Z + 0.5, h * Z); g.stroke();
    if (big) { g.fillStyle = '#fff'; g.fillRect(gx * Z + 1, 0, 20, 11); g.fillStyle = '#c00'; g.fillText(String(x + gx), gx * Z + 2, 9); }
  }
  for (let gy = 0; gy <= h; gy += 5) {
    const big = (y + gy) % 25 === 0;
    g.strokeStyle = big ? 'rgba(0,90,255,0.85)' : 'rgba(0,90,255,0.22)';
    g.beginPath(); g.moveTo(0, gy * Z + 0.5); g.lineTo(w * Z, gy * Z + 0.5); g.stroke();
    if (big) { g.fillStyle = '#fff'; g.fillRect(0, gy * Z + 1, 20, 11); g.fillStyle = '#05c'; g.fillText(String(y + gy), 1, gy * Z + 10); }
  }
}, [b64, +x, +y, +w, +h, +z]);

await page.waitForTimeout(250);
await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
console.log(`输出：${OUT}/${name}.png`);
await browser.close();
