/**
 * 把参考图某区域打成 ASCII 色块图，直接读胶囊的边界。
 * 字符：B=近黑 · L=青柠 · W=白 · Y=黄 · R=红 · .=其它
 * 每格 = STEP×STEP 像素，行首/列首打印绝对坐标。
 * 用法：node scripts/ascii-ref.mjs x y w h [step]
 */
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

const [X, Y, W, H, STEP = 4] = process.argv.slice(2).map(Number);
const FILE = process.env.ASCII_FILE ?? 'outputs/entry-ref.png';
const b64 = `data:image/png;base64,${readFileSync(FILE).toString('base64')}`;

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 300, height: 200 } });
await page.setContent('<!doctype html><html><body></body></html>');

const rows = await page.evaluate(async ([src, X, Y, W, H, S]) => {
  const img = await new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = src; });
  const c = document.createElement('canvas');
  c.width = img.width; c.height = img.height;
  const g = c.getContext('2d');
  g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, img.width, img.height).data;
  const Wd = img.width;
  const cls = (x, y) => {
    const i = (y * Wd + x) * 4;
    const r = d[i], gg = d[i + 1], b = d[i + 2];
    const lum = 0.299 * r + 0.587 * gg + 0.114 * b;
    if (lum < 75) return 'B';
    if (r > 240 && gg > 240 && b > 240) return 'W';
    if (gg > 190 && b < 170 && r > 120) return 'L';
    if (r > 190 && gg > 150 && b < 110) return 'Y';
    if (r > 150 && gg < 120 && b < 130) return 'R';
    return '.';
  };
  const out = [];
  for (let y = Y; y < Y + H; y += S) {
    let line = '';
    for (let x = X; x < X + W; x += S) line += cls(x, y);
    out.push([y, line]);
  }
  return out;
}, [b64, X, Y, W, H, STEP]);

// 列坐标尺
let ruler1 = '', ruler2 = '';
for (let x = X, i = 0; x < X + W; x += STEP, i++) {
  const v = String(x);
  ruler1 += i % 5 === 0 ? v.padEnd(5).slice(0, 5) : ' '.repeat(5);
  ruler2 += i % 5 === 0 ? '|'.padEnd(5) : ' '.repeat(5);
}
console.log(ruler1);
console.log(ruler2);
for (const [y, line] of rows) console.log(String(y).padStart(4) + ' ' + line);
await browser.close();
