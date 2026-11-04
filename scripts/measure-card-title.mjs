/**
 * 量成品卡面图里「文字行」的高度（占画布高的百分比），用来判断两张卡的字号是否一致。
 * 做法：逐行统计指定横向窗口内「文字色」像素的占比，连续成段即一行字。
 *   --light  文字是浅色（深底卡，如招牌卡白字）
 *   --dark   文字是深色（浅底卡，如邀请卡黑字）
 *
 * 用法：node scripts/measure-card-title.mjs <图片> [--light|--dark] [x0,x1] [y0,y1]
 * 例：  node scripts/measure-card-title.mjs public/signature-card.jpg --light 0.05,0.60 0,0.45
 */
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--') && !/^[\d.,]+$/.test(a));
const mode = args.includes('--light') ? 'light' : 'dark';
const rangeArg = args.find((a) => /^[\d.]+,[\d.]+$/.test(a));
const [x0r, x1r] = (rangeArg || '0.05,0.65').split(',').map(Number);
const yArg = args.find((a) => /^[\d.]+,[\d.]+$/.test(a) && args.indexOf(a) > args.indexOf(rangeArg));
const [y0r, y1r] = (yArg || '0,0.50').split(',').map(Number);

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 200, height: 200 } });
await page.setContent('<!doctype html><html><body></body></html>');

const b64 = `data:image/jpeg;base64,${readFileSync(file).toString('base64')}`;
const res = await page.evaluate(async ([src, mode, x0r, x1r, y0r, y1r]) => {
  const img = await new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = src; });
  const c = document.createElement('canvas');
  c.width = img.width; c.height = img.height;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, img.width, img.height).data;
  const W = img.width, H = img.height;

  const x0 = Math.round(W * x0r), x1 = Math.round(W * x1r);
  const y0 = Math.round(H * y0r), y1 = Math.round(H * y1r);
  const rows = [];
  for (let y = y0; y < y1; y++) {
    let hit = 0, total = 0;
    for (let x = x0; x < x1; x++) {
      const p = (y * W + x) * 4;
      const l = 0.299 * d[p] + 0.587 * d[p + 1] + 0.114 * d[p + 2];
      if (mode === 'light' ? l > 205 : l < 95) hit++;
      total++;
    }
    rows.push(hit / total);
  }
  // 连续成段（占比 > 8% 视为文字行），并量每段的横向墨迹范围
  const bands = [];
  let start = -1;
  for (let i = 0; i < rows.length; i++) {
    const on = rows[i] > 0.08;
    if (on && start < 0) start = i;
    if (!on && start >= 0) { bands.push([y0 + start, y0 + i - 1]); start = -1; }
  }
  if (start >= 0) bands.push([y0 + start, y1 - 1]);

  const out = bands.map(([a, b]) => {
    let bx0 = W, bx1 = -1;
    for (let y = a; y <= b; y++) {
      for (let x = x0; x < x1; x++) {
        const p = (y * W + x) * 4;
        const l = 0.299 * d[p] + 0.587 * d[p + 1] + 0.114 * d[p + 2];
        if (mode === 'light' ? l > 205 : l < 95) { if (x < bx0) bx0 = x; if (x > bx1) bx1 = x; }
      }
    }
    return {
      y0: a, y1: b, h: b - a + 1, pct: +((b - a + 1) / H * 100).toFixed(2),
      x0: bx0, x1: bx1, w: bx1 - bx0 + 1, wpct: +((bx1 - bx0 + 1) / W * 100).toFixed(2),
    };
  });
  return { W, H, bands: out };
}, [b64, mode, x0r, x1r, y0r, y1r]);

console.log(`${file}  ${res.W}×${res.H}  ${mode}  x ${(x0r * 100).toFixed(0)}%~${(x1r * 100).toFixed(0)}%  y ${(y0r * 100).toFixed(0)}%~${(y1r * 100).toFixed(0)}%`);
console.log('文字行：');
for (const b of res.bands) {
  console.log(`  y ${String(b.y0).padStart(4)}~${String(b.y1).padStart(4)}  高 ${String(b.h).padStart(4)} (${b.pct}%)` +
    `   x ${String(b.x0).padStart(4)}~${String(b.x1).padStart(4)}  宽 ${String(b.w).padStart(4)} (${b.wpct}%)`);
}
await browser.close();
