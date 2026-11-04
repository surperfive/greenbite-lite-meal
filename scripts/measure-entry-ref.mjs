/**
 * 量参考图（首页四个入口卡）：定位四张卡片矩形 + 每张卡 2× 网格放大图。
 * 用法：node scripts/measure-entry-ref.mjs
 */
import { chromium } from 'playwright';
import { readFileSync, mkdirSync } from 'node:fs';

const SRC = 'outputs/entry-ref.png';
const OUT = 'outputs/entry-ref-measure';
mkdirSync(OUT, { recursive: true });
const b64 = `data:image/png;base64,${readFileSync(SRC).toString('base64')}`;

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1400, height: 1400 }, deviceScaleFactor: 2 });
await page.setContent('<!doctype html><html><body style="margin:0;background:#111"></body></html>');

const info = await page.evaluate(async (src) => {
  const img = await new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = src; });
  const c = document.createElement('canvas');
  c.width = img.width; c.height = img.height;
  const g = c.getContext('2d');
  g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, img.width, img.height).data;
  const W = img.width, H = img.height;
  const lum = (i) => 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];

  const colDark = new Array(W).fill(0), rowDark = new Array(H).fill(0);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4;
    if (lum(i) < 70) { colDark[x]++; rowDark[y]++; }
  }
  const segs = (arr, min) => {
    const out = []; let s = -1;
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] >= min) { if (s < 0) s = i; }
      else if (s >= 0) { out.push([s, i - 1]); s = -1; }
    }
    if (s >= 0) out.push([s, arr.length - 1]);
    return out;
  };
  return {
    W, H,
    vLines: segs(colDark, Math.round(H * 0.30)),
    hLines: segs(rowDark, Math.round(W * 0.30)),
  };
}, b64);

console.log('参考图尺寸', info.W, '×', info.H);
console.log('竖线', JSON.stringify(info.vLines));
console.log('横线', JSON.stringify(info.hLines));

const mid = (s) => Math.round((s[0] + s[1]) / 2);
const xs = info.vLines.map(mid), ys = info.hLines.map(mid);
console.log('x 中心', xs.join(', '));
console.log('y 中心', ys.join(', '));

// 用「最外两条竖线 / 横线」当卡片外框，中间两条当分界
// ⚠️ 自动检测会被标题大字（42–72 / 262–290 那两条「横线」）和卡内深色元素骗到，
//    所以这里直接按人工核对的边界写死（已用网格图验证）。
const cards = [
  { name: 'takeout', x: 12, y: 13, w: 287, h: 205 },
  { name: 'pickup', x: 310, y: 13, w: 278, h: 205 },
  { name: 'benefit', x: 12, y: 231, w: 287, h: 206 },
  { name: 'gacha', x: 310, y: 231, w: 278, h: 206 },
];
console.log('\n卡片矩形:');
for (const c of cards) console.log(`  ${c.name}: x${c.x} y${c.y} ${c.w}×${c.h}  (比例 ${(c.w / c.h).toFixed(3)})`);

await page.evaluate(async ([src, cards]) => {
  const img = await new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = src; });
  const host = document.createElement('div');
  host.style.cssText = 'display:flex;flex-wrap:wrap;gap:14px;padding:10px';
  document.body.appendChild(host);
  const Z = 2;
  for (const c of cards) {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'color:#fff;font:12px system-ui';
    wrap.innerHTML = `<div>${c.name} · ${c.w}×${c.h}</div>`;
    const cv = document.createElement('canvas');
    cv.width = c.w * Z; cv.height = c.h * Z;
    cv.style.width = c.w * Z + 'px'; cv.style.height = c.h * Z + 'px';
    wrap.appendChild(cv);
    host.appendChild(wrap);
    const g = cv.getContext('2d');
    g.drawImage(img, c.x, c.y, c.w, c.h, 0, 0, c.w * Z, c.h * Z);
    g.strokeStyle = 'rgba(255,0,0,0.4)'; g.lineWidth = 1;
    g.font = '10px monospace'; g.fillStyle = 'rgba(180,0,0,1)';
    for (let gx = 0; gx <= c.w; gx += 10) {
      g.beginPath(); g.moveTo(gx * Z + 0.5, 0); g.lineTo(gx * Z + 0.5, c.h * Z); g.stroke();
      if (gx % 50 === 0) { g.fillStyle = '#fff'; g.fillRect(gx * Z, 0, 22, 12); g.fillStyle = '#b00'; g.fillText(String(gx), gx * Z + 1, 10); }
    }
    for (let gy = 0; gy <= c.h; gy += 10) {
      g.beginPath(); g.moveTo(0, gy * Z + 0.5); g.lineTo(c.w * Z, gy * Z + 0.5); g.stroke();
      if (gy % 50 === 0) { g.fillStyle = '#fff'; g.fillRect(0, gy * Z, 22, 12); g.fillStyle = '#b00'; g.fillText(String(gy), 1, gy * Z + 10); }
    }
  }
}, [b64, cards]);

await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/cards-grid.png`, fullPage: true });
console.log(`\n输出：${OUT}/cards-grid.png`);
await browser.close();
