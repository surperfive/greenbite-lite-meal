/**
 * 量源图四角"深色残留"的外缘半径（欧氏距离最大值），给圆角裁切定数值。
 * 深色不是纯楔形：外面还套了一圈更细的深色描边，所以只看单行侵入深度会漏。
 */
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

const SRC = process.argv[2] || 'public/ordering_header_banner.png';
const b64in = readFileSync(SRC).toString('base64');

const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage();
await page.goto('about:blank');

const out = await page.evaluate(
  async ({ b64in }) => {
    const im = new Image();
    im.src = 'data:image/png;base64,' + b64in;
    await im.decode();
    const W = im.naturalWidth;
    const H = im.naturalHeight;
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(im, 0, 0);
    const d = ctx.getImageData(0, 0, W, H).data;
    const dark = (x, y) => {
      const i = (y * W + x) * 4;
      return d[i] < 90 && d[i + 1] < 90 && d[i + 2] < 90;
    };
    const R = 60;
    const res = {};
    for (const k of ['tl', 'tr', 'bl', 'br']) {
      let maxD = 0;
      let argmax = null;
      for (let y = 0; y < R; y++) {
        for (let x = 0; x < R; x++) {
          const gx = k.includes('l') ? x : W - 1 - x;
          const gy = k.includes('t') ? y : H - 1 - y;
          if (!dark(gx, gy)) continue;
          const dist = Math.hypot(x, y);
          if (dist > maxD) {
            maxD = dist;
            argmax = [x, y];
          }
        }
      }
      res[k] = { maxRadiusSrc: +maxD.toFixed(1), at: argmax, cssAt410: +((maxD * 410) / W).toFixed(2) };
    }
    return res;
  },
  { b64in }
);

console.log(JSON.stringify(out, null, 2));
await browser.close();
