/**
 * 图片降采样 + 重编码（纯浏览器 canvas，不依赖 sharp）。
 * 用法：node scripts/optimize-image.mjs <输入> <输出> <目标边长> [quality=88]
 * 例：  node scripts/optimize-image.mjs public/raw/bowl.jpg public/signature-bowl.jpg 480
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';

const [input, output, sizeArg, qArg] = process.argv.slice(2);
if (!input || !output) {
  console.error('用法：node scripts/optimize-image.mjs <输入> <输出> <目标边长> [quality]');
  process.exit(1);
}
const target = Number(sizeArg || 480);
const quality = Number(qArg || 88);
const isPng = /\.png$/i.test(output);

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 200, height: 200 } });
await page.setContent('<!doctype html><html><body></body></html>');

const dataUrl = `data:image/jpeg;base64,${readFileSync(input).toString('base64')}`;
const res = await page.evaluate(async ([src, target, quality, isPng]) => {
  const img = await new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = src; });
  const scale = target / Math.max(img.width, img.height);
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = true;
  g.imageSmoothingQuality = 'high';
  g.drawImage(img, 0, 0, w, h);
  return { w, h, srcW: img.width, srcH: img.height, url: c.toDataURL(isPng ? 'image/png' : 'image/jpeg', quality) };
}, [dataUrl, target, quality, isPng]);

writeFileSync(output, Buffer.from(res.url.split(',')[1], 'base64'));
console.log(`${input}  ${res.srcW}×${res.srcH}  →  ${output}  ${res.w}×${res.h}`);
await browser.close();
