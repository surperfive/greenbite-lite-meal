/**
 * 单卡 3× 网格放大：读插图边界用（每 10px 细线，每 50px 标数字）。
 * 用法：node scripts/zoom-entry-card.mjs takeout|pickup|benefit|gacha [Z]
 */
import { chromium } from 'playwright';
import { readFileSync, mkdirSync } from 'node:fs';

const RECTS = {
  takeout: { x: 12, y: 13, w: 287, h: 205 },
  pickup: { x: 310, y: 13, w: 278, h: 205 },
  benefit: { x: 12, y: 231, w: 287, h: 206 },
  gacha: { x: 310, y: 231, w: 278, h: 206 },
};
const name = process.argv[2] ?? 'takeout';
const Z = Number(process.argv[3] ?? 3);
const OUT = 'outputs/entry-ref-measure';
mkdirSync(OUT, { recursive: true });

const b64 = `data:image/png;base64,${readFileSync('outputs/entry-ref.png').toString('base64')}`;
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1200, height: 1000 }, deviceScaleFactor: 2 });
await page.setContent('<!doctype html><html><body style="margin:0;background:#111"></body></html>');

const c = RECTS[name];
await page.evaluate(async ([src, c, Z]) => {
  const img = await new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = src; });
  const cv = document.createElement('canvas');
  cv.width = c.w * Z; cv.height = c.h * Z;
  cv.style.cssText = `width:${c.w * Z}px;height:${c.h * Z}px;display:block`;
  document.body.appendChild(cv);
  const g = cv.getContext('2d');
  g.drawImage(img, c.x, c.y, c.w, c.h, 0, 0, c.w * Z, c.h * Z);
  g.font = '11px monospace';
  for (let gx = 0; gx <= c.w; gx += 10) {
    g.strokeStyle = gx % 50 === 0 ? 'rgba(255,0,0,0.75)' : 'rgba(255,0,0,0.25)';
    g.beginPath(); g.moveTo(gx * Z + 0.5, 0); g.lineTo(gx * Z + 0.5, c.h * Z); g.stroke();
    if (gx % 50 === 0) { g.fillStyle = '#fff'; g.fillRect(gx * Z + 1, 1, 26, 14); g.fillStyle = '#c00'; g.fillText(String(gx), gx * Z + 2, 12); }
  }
  for (let gy = 0; gy <= c.h; gy += 10) {
    g.strokeStyle = gy % 50 === 0 ? 'rgba(0,0,255,0.75)' : 'rgba(0,0,255,0.22)';
    g.beginPath(); g.moveTo(0, gy * Z + 0.5); g.lineTo(c.w * Z, gy * Z + 0.5); g.stroke();
    if (gy % 50 === 0) { g.fillStyle = '#fff'; g.fillRect(1, gy * Z + 1, 26, 14); g.fillStyle = '#00c'; g.fillText(String(gy), 2, gy * Z + 12); }
  }
}, [b64, c, Z]);

await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}/${name}-${Z}x.png`, fullPage: true });
console.log(`输出：${OUT}/${name}-${Z}x.png  (卡 ${c.w}×${c.h})`);
await browser.close();
