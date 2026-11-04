/** 逐行统计海报「有内容」的像素比例，用来决定上下各裁多少。输出到 outputs/banner-rows.txt */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const SRC = process.argv[2] || 'public/ordering_header_banner.png';
mkdirSync('outputs', { recursive: true });
const b64in = readFileSync(SRC).toString('base64');

const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage();
await page.goto('about:blank');
const res = await page.evaluate(async ({ b64in }) => {
  const im = new Image();
  im.src = 'data:image/png;base64,' + b64in;
  await im.decode();
  const c = document.createElement('canvas');
  c.width = im.width;
  c.height = im.height;
  const ctx = c.getContext('2d');
  ctx.drawImage(im, 0, 0);
  const d = ctx.getImageData(0, 0, im.width, im.height).data;
  const BG = [174, 232, 23];
  const rows = [];
  for (let y = 0; y < im.height; y++) {
    let n = 0;
    for (let x = 0; x < im.width; x += 2) {
      const j = (y * im.width + x) * 4;
      const dist = Math.abs(d[j] - BG[0]) + Math.abs(d[j + 1] - BG[1]) + Math.abs(d[j + 2] - BG[2]);
      if (dist > 24) n++;
    }
    rows.push(n / (im.width / 2));
  }
  return { W: im.width, H: im.height, rows };
}, { b64in });

const first = res.rows.findIndex((v) => v > 0.005);
const last = res.rows.length - 1 - [...res.rows].reverse().findIndex((v) => v > 0.005);
const lines = [
  `size=${res.W}x${res.H}`,
  `firstContentRow=${first} lastContentRow=${last}`,
  `blankTop=${first} blankBottom=${res.H - 1 - last}`,
  'row ratio',
];
for (let y = 0; y < res.H; y += 4) {
  lines.push(`${String(y).padStart(4)}  ${res.rows[y].toFixed(3)}  ${'#'.repeat(Math.round(res.rows[y] * 40))}`);
}
writeFileSync('outputs/banner-rows.txt', lines.join('\n'), 'utf8');
console.log('ok');
await browser.close();
