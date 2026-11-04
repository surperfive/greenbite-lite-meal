/**
 * 采样参考图若干坐标的颜色（HEX）。
 * 用法：node scripts/sample-ref.mjs "x,y" "x,y" ...
 */
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

const pts = process.argv.slice(2).map((s) => s.split(',').map(Number));
const b64 = `data:image/png;base64,${readFileSync('outputs/entry-ref.png').toString('base64')}`;

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 300, height: 200 } });
await page.setContent('<!doctype html><html><body></body></html>');

const out = await page.evaluate(async ([src, pts]) => {
  const img = await new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = src; });
  const c = document.createElement('canvas');
  c.width = img.width; c.height = img.height;
  const g = c.getContext('2d');
  g.drawImage(img, 0, 0);
  return pts.map(([x, y]) => {
    const d = g.getImageData(x, y, 1, 1).data;
    const hex = '#' + [d[0], d[1], d[2]].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();
    return `${x},${y} → ${hex}`;
  });
}, [b64, pts]);

console.log(out.join('\n'));
await browser.close();
