/**
 * 把源图四个角各裁 64×64，最近邻放大 8 倍落地，肉眼看清深色到底是"填充楔形"还是"描边"。
 * 用法：node scripts/zoom-banner-corners.mjs [源PNG] [输出目录]
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const SRC = process.argv[2] || 'outputs/banner-src/' + 'placeholder';
const OUT = process.argv[3] || 'outputs/banner-src-zoom';
mkdirSync(OUT, { recursive: true });

const b64in = readFileSync(SRC).toString('base64');
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage();
await page.goto('about:blank');

const res = await page.evaluate(
  async ({ b64in }) => {
    const im = new Image();
    im.src = 'data:image/png;base64,' + b64in;
    await im.decode();
    const W = im.naturalWidth;
    const H = im.naturalHeight;
    const N = 64;
    const Z = 8;
    const crops = {
      tl: [0, 0],
      tr: [W - N, 0],
      bl: [0, H - N],
      br: [W - N, H - N],
    };
    const out = {};
    for (const [k, [sx, sy]] of Object.entries(crops)) {
      const c = document.createElement('canvas');
      c.width = N * Z;
      c.height = N * Z;
      const ctx = c.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(im, sx, sy, N, N, 0, 0, N * Z, N * Z);
      out[k] = c.toDataURL('image/png').split(',')[1];
    }
    // 顺带把四角 32×32 区域打成 ASCII 图（X=深色 . =亮），用来精确读半径
    const c2 = document.createElement('canvas');
    c2.width = W;
    c2.height = H;
    const x2 = c2.getContext('2d', { willReadFrequently: true });
    x2.drawImage(im, 0, 0);
    const darkAt = (x, y) => {
      const d = x2.getImageData(x, y, 1, 1).data;
      return d[0] < 90 && d[1] < 90 && d[2] < 90;
    };
    const ascii = {};
    for (const k of Object.keys(crops)) {
      const rows = [];
      for (let y = 0; y < 32; y++) {
        let line = '';
        for (let x = 0; x < 32; x++) {
          // 左/右侧、上/下侧分别从对应边缘往里数，四个角共用一套读法
          const gx = k.includes('l') ? x : W - 1 - x;
          const gy = k.includes('t') ? y : H - 1 - y;
          line += darkAt(gx, gy) ? 'X' : '.';
        }
        rows.push(line);
      }
      ascii[k] = { corner: k.includes('l') ? (k.includes('t') ? '左上' : '左下') : k.includes('t') ? '右上' : '右下', rows };
    }
    return { out, ascii, size: `${W}x${H}` };
  },
  { b64in }
);

for (const [k, b64] of Object.entries(res.out)) {
  writeFileSync(`${OUT}/${k}.png`, Buffer.from(b64, 'base64'));
}
writeFileSync(`${OUT}/ascii.txt`, JSON.stringify({ size: res.size, ascii: res.ascii }, null, 2), 'utf8');
console.log('ok ' + OUT + ' ' + res.size);
await browser.close();
