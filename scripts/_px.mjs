import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const src = process.argv[2];
const pts = process.argv.slice(3).map((s) => s.split(',').map(Number));
const mime = src.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
const b64 = `data:${mime};base64,${readFileSync(src).toString('base64')}`;
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage();
const r = await page.evaluate(async ([src, pts]) => {
  const img = new Image(); img.src = src; await img.decode();
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
  const g = c.getContext('2d'); g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, img.width, img.height).data;
  const at = (x, y) => { const i = (y * img.width + x) * 4; return [d[i], d[i+1], d[i+2], d[i+3]]; };
  const hex = (c) => '#' + c.slice(0,3).map(v => v.toString(16).padStart(2,'0')).join('').toUpperCase();
  // 每一列/每一行的最暗像素亮度，用来找卡片边界
  const colMin = [], rowMin = [];
  for (let x = 0; x < img.width; x++) { let m = 255; for (let y = 0; y < img.height; y++) { const p = at(x,y); const l = 0.299*p[0]+0.587*p[1]+0.114*p[2]; if (l < m) m = l; } colMin.push(Math.round(m)); }
  for (let y = 0; y < img.height; y++) { let m = 255; for (let x = 0; x < img.width; x++) { const p = at(x,y); const l = 0.299*p[0]+0.587*p[1]+0.114*p[2]; if (l < m) m = l; } rowMin.push(Math.round(m)); }
  const firstDark = (arr, th) => arr.findIndex((v) => v < th);
  const lastDark = (arr, th) => arr.length - 1 - [...arr].reverse().findIndex((v) => v < th);
  return {
    W: img.width, H: img.height,
    pts: pts.map(([x,y]) => [x, y, hex(at(x,y))]),
    col: { first180: firstDark(colMin,180), last180: lastDark(colMin,180), first230: firstDark(colMin,230), last230: lastDark(colMin,230) },
    row: { first180: firstDark(rowMin,180), last180: lastDark(rowMin,180), first230: firstDark(rowMin,230), last230: lastDark(rowMin,230) },
    colTail: colMin.slice(-40), rowTail: rowMin.slice(-40)
  };
}, [b64, pts]);
console.log(JSON.stringify(r, null, 1));
await browser.close();
