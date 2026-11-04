/**
 * 量四张入口插画的「外轮廓黑描边」粗细（源图像素）。
 * 做法：逐行从左右两侧向里扫，找到第一个近黑像素，量它连着的黑像素数 ——
 * 这条就是剪影上的外描边，不受内部细节干扰。取中位数。
 * 用法：node scripts/measure-entry-stroke.mjs
 */
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

// 用法：node scripts/measure-entry-stroke.mjs [--norm]
//   --norm 改量 public/entry-norm/*.png（归一化后的产物）
const NORM = process.argv.includes('--norm');
const ext = NORM ? 'png' : 'jpg';
const dir = NORM ? 'public/entry-norm' : 'public';

const FILES = [
  ['entry-takeout', '外卖配送', 1024],
  ['entry-pickup', '到店自取', 1089],
  ['entry-benefit', '福利中心', 1093],
  ['entry-gacha', '今日抽卡', 1084],
];

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 300, height: 200 } });
await page.setContent('<!doctype html><html><body></body></html>');
if (NORM) console.log('（测量对象：public/entry-norm/*.png）\n');

for (const [name, label, srcH] of FILES) {
  const file = `${name}.${ext}`;
  const b64 = `data:image/${ext === 'png' ? 'png' : 'jpeg'};base64,${readFileSync(`${dir}/${file}`).toString('base64')}`;
  const r = await page.evaluate(async (src) => {
    const img = await new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = src; });
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, img.width, img.height).data;
    const W = img.width, H = img.height;
    const lum = (x, y) => {
      const i = (y * W + x) * 4;
      return 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    };
    const runs = [];
    for (let y = Math.round(H * 0.12); y < H * 0.88; y++) {
      for (const dir of [1, -1]) {
        // 找第一个近黑像素（从两侧往中间扫）
        let x = dir === 1 ? 0 : W - 1;
        const end = dir === 1 ? W : -1;
        while (x !== end && lum(x, y) > 90) x += dir;
        if (x === end) continue;
        // 量连续近黑长度
        let n = 0;
        let xx = x;
        while (xx !== end && lum(xx, y) <= 90) { n++; xx += dir; }
        if (n >= 3 && n <= 60) runs.push(n);
      }
    }
    runs.sort((a, b) => a - b);
    const med = runs[Math.floor(runs.length / 2)];
    const p25 = runs[Math.floor(runs.length * 0.25)];
    const p75 = runs[Math.floor(runs.length * 0.75)];
    return { W, H, n: runs.length, med, p25, p75 };
  }, b64);

  const scale62 = 62 / r.H;
  const scale72 = 72 / r.H;
  console.log(
    `${label.padEnd(6)} 源 ${r.W}×${r.H}  描边中位 ${r.med}px (P25 ${r.p25} / P75 ${r.p75}, n=${r.n})` +
    `  → 渲染高62时 ${(r.med * scale62).toFixed(2)}px · 高72时 ${(r.med * scale72).toFixed(2)}px`
  );
}
await browser.close();
