/**
 * 量四张入口插画素材：尺寸 + 非白内容包围盒（含黑描边），算出留白比例。
 * 用法：node scripts/measure-entry-assets.mjs
 */
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

const FILES = [
  ['entry-takeout.jpg', '外卖配送'],
  ['entry-pickup.jpg', '到店自取'],
  ['entry-benefit.jpg', '福利中心'],
  ['entry-gacha.jpg', '今日抽卡'],
];

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 400, height: 300 } });
await page.setContent('<!doctype html><html><body></body></html>');

for (const [file, label] of FILES) {
  const b64 = `data:image/jpeg;base64,${readFileSync(`public/${file}`).toString('base64')}`;
  const r = await page.evaluate(async (src) => {
    const img = await new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = src; });
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, img.width, img.height).data;
    const W = img.width, H = img.height;
    let minX = W, minY = H, maxX = -1, maxY = -1;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      const isWhite = d[i] > 244 && d[i + 1] > 244 && d[i + 2] > 244;
      if (!isWhite) {
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
      }
    }
    return { W, H, minX, minY, maxX, maxY };
  }, b64);
  const pct = (v, t) => +(v / t * 100).toFixed(1);
  const cw = r.maxX - r.minX + 1, ch = r.maxY - r.minY + 1;
  console.log(
    `${label} ${file}  ${r.W}×${r.H}  内容 ${cw}×${ch}  留白 上${pct(r.minY, r.H)}/下${pct(r.H - 1 - r.maxY, r.H)}/左${pct(r.minX, r.W)}/右${pct(r.W - 1 - r.maxX, r.W)}%  内容占比 ${pct(cw, r.W)}%×${pct(ch, r.H)}%`
  );
}
await browser.close();
