/**
 * 量某个颜色（品牌青柠 / 黑胶囊 / 纯色块）在截图里的包围盒。
 * 用法：node scripts/bbox-color.mjs <图片> <目标hex> [容差=40] [--json]
 * 例：  node scripts/bbox-color.mjs shot.png C7F665 40
 *
 * ⚠️ 只适合「大面积纯色块」（青柠条、黑胶囊）。多色插画别用 —— 会连邻近色一起吞。
 */
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

const [file, hexArg, tolArg] = process.argv.slice(2);
const tol = Number(tolArg || 40);
const hex = (hexArg || 'C7F665').replace('#', '');
const tr = parseInt(hex.slice(0, 2), 16), tg = parseInt(hex.slice(2, 4), 16), tb = parseInt(hex.slice(4, 6), 16);
const isPng = /\.png$/i.test(file);

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 200, height: 200 } });
await page.setContent('<!doctype html><html><body></body></html>');

const b64 = `data:image/${isPng ? 'png' : 'jpeg'};base64,${readFileSync(file).toString('base64')}`;
const res = await page.evaluate(async ([src, tr, tg, tb, tol]) => {
  const img = await new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = src; });
  const c = document.createElement('canvas');
  c.width = img.width; c.height = img.height;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, img.width, img.height).data;
  const W = img.width, H = img.height;
  let x0 = W, y0 = H, x1 = -1, y1 = -1, n = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const p = (y * W + x) * 4;
      if (Math.abs(d[p] - tr) <= tol && Math.abs(d[p + 1] - tg) <= tol && Math.abs(d[p + 2] - tb) <= tol) {
        n++;
        if (x < x0) x0 = x; if (x > x1) x1 = x;
        if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
    }
  }
  if (!n) return { W, H, found: false };
  // 每行/每列的青柠像素数，用来判断是不是「一条」而不是散点
  const rowFill = [];
  for (let y = y0; y <= y1; y++) {
    let c2 = 0;
    for (let x = x0; x <= x1; x++) {
      const p = (y * W + x) * 4;
      if (Math.abs(d[p] - tr) <= tol && Math.abs(d[p + 1] - tg) <= tol && Math.abs(d[p + 2] - tb) <= tol) c2++;
    }
    rowFill.push(+(c2 / (x1 - x0 + 1)).toFixed(2));
  }
  return { W, H, found: true, x0, y0, x1, y1, w: x1 - x0 + 1, h: y1 - y0 + 1, n, rowFill };
}, [b64, tr, tg, tb, tol]);

if (!res.found) {
  console.log('没找到匹配像素');
} else {
  console.log(`${file}  图 ${res.W}×${res.H}  目标 #${hex} 容差 ${tol}`);
  console.log(`包围盒 x ${res.x0}~${res.x1}  y ${res.y0}~${res.y1}   ${res.w} × ${res.h}   比例 ${(res.w / res.h).toFixed(3)}`);
  console.log(`占图宽 ${(res.w / res.W * 100).toFixed(1)}%  占图高 ${(res.h / res.H * 100).toFixed(1)}%`);
  console.log(`逐行填充率（首/中/尾）：${res.rowFill[0]} … ${res.rowFill[Math.floor(res.rowFill.length / 2)]} … ${res.rowFill[res.rowFill.length - 1]}`);
}
await browser.close();
