/** 定位吉祥物「白手套 / 奶茶杯」的最下沿，用来判断裁到哪一行不会切手。
 *  node scripts/probe-banner-hands.mjs */
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

const b64in = readFileSync('public/ordering_header_banner.png').toString('base64');
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage();
await page.goto('about:blank');
const r = await page.evaluate(async ({ b64in }) => {
  const im = new Image();
  im.src = 'data:image/png;base64,' + b64in;
  await im.decode();
  const c = document.createElement('canvas');
  c.width = im.width;
  c.height = im.height;
  const ctx = c.getContext('2d');
  ctx.drawImage(im, 0, 0);
  const d = ctx.getImageData(0, 0, im.width, im.height).data;
  const isWhite = (i) => {
    const [R, G, B] = [d[i], d[i + 1], d[i + 2]];
    const mx = Math.max(R, G, B);
    const mn = Math.min(R, G, B);
    return mn > 185 && mx - mn < 32;
  };
  // 每行「白像素」数量（右侧 560~940）
  const out = [];
  for (let y = 0; y < im.height; y++) {
    let n = 0;
    for (let x = 560; x <= 940; x++) if (isWhite((y * im.width + x) * 4)) n++;
    out.push(n);
  }
  // 白像素最下沿
  let lastWhite = -1;
  for (let y = out.length - 1; y >= 0; y--)
    if (out[y] > 3) {
      lastWhite = y;
      break;
    }
  return { rows: out, lastWhite, H: im.height };
}, { b64in });

const lines = ['y  whitePx'];
r.rows.forEach((n, y) => {
  if (y % 5 === 0) lines.push(`${String(y).padStart(4)} ${String(n).padStart(4)} ${'#'.repeat(Math.min(40, n))}`);
});
console.log(lines.filter((l) => !/^ *\d+ +0 *$/.test(l)).slice(-30).join('\n'));
console.log('lastWhite=' + r.lastWhite + ' H=' + r.H + ' → aspect 分母建议 ' + (r.lastWhite + 8));
await browser.close();
