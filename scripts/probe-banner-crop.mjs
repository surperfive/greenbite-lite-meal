/** 逐行统计 head 图「有内容」的像素比例，定位可以裁掉的行。
 *  输出 outputs/banner-crop.txt */
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
  // 背景 = 全图「青柠色」像素的中位数（左上角是深色圆角，不能当参考）
  const cand = [];
  for (let y = 0; y < im.height; y += 3) {
    for (let x = 0; x < im.width; x += 3) {
      const j = (y * im.width + x) * 4;
      const [r, g, b] = [d[j], d[j + 1], d[j + 2]];
      if (g > 150 && g > r + 20 && g > b + 60) cand.push([r, g, b]);
    }
  }
  const med = (k) => {
    const a = cand.map((c) => c[k]).sort((p, q) => p - q);
    return a[Math.floor(a.length / 2)];
  };
  const BG = [med(0), med(1), med(2)];
  const rowsAll = [];
  const rowsRight = []; // 右侧吉祥物带 x 560~940
  for (let y = 0; y < im.height; y++) {
    let n = 0;
    let m = 0;
    let cntR = 0;
    for (let x = 0; x < im.width; x += 2) {
      const j = (y * im.width + x) * 4;
      const dist =
        Math.abs(d[j] - BG[0]) + Math.abs(d[j + 1] - BG[1]) + Math.abs(d[j + 2] - BG[2]);
      if (dist > 36) {
        n++;
        if (x >= 560 && x <= 940) m++;
      }
      if (x >= 560 && x <= 940) cntR++;
    }
    rowsAll.push(n / (im.width / 2));
    rowsRight.push(m / cntR);
  }
  return { W: im.width, H: im.height, BG, rowsAll, rowsRight };
}, { b64in });

const lines = [
  `size=${res.W}x${res.H} bg=${res.BG.join(',')}`,
  ' y   all   right',
];
for (let y = 0; y < res.H; y += 5) {
  lines.push(
    `${String(y).padStart(4)}  ${res.rowsAll[y].toFixed(3)}  ${res.rowsRight[y].toFixed(3)}  ${'#'.repeat(
      Math.round(res.rowsAll[y] * 40)
    )}`
  );
}
// 吉祥物带（右）最后一行有明显内容的位置
const lastRight = res.rowsRight.length - 1 - [...res.rowsRight].reverse().findIndex((v) => v > 0.02);
const lastAll = res.rowsAll.length - 1 - [...res.rowsAll].reverse().findIndex((v) => v > 0.02);
lines.push(`lastRightContent=${lastRight}  lastAnyContent=${lastAll}`);
writeFileSync('outputs/banner-crop.txt', lines.join('\n'), 'utf8');
console.log(lines.slice(-2).join('\n'));
console.log('ok');
await browser.close();
