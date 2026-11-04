/**
 * 订单页缩略图特写（验证 cover 模式下食物放大系数）。
 * 用法：node scripts/shot-orders-thumb.mjs [outDir]
 */
import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
import fs from 'node:fs';

const outDir = process.argv[2] ?? 'outputs/orders-thumb';
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 3 });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));

await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.click('#nav-tab-orders');
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('text=再来一单', { timeout: 20000 });
await page.waitForTimeout(800);

await page.screenshot({ path: `${outDir}/orders-page.png` });

// 每张订单卡的缩略图区特写
const cards = await page.$$('.bg-white.rounded-\\[20px\\]');
console.log('cards:', cards.length);
for (let i = 0; i < Math.min(cards.length, 3); i++) {
  const c = cards[i];
  await c.scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);
  await c.screenshot({ path: `${outDir}/card-${i + 1}.png` });
}

// 几何：每个缩略图里食物 img 的实际渲染尺寸 vs 容器
const geo = await page.evaluate(() => {
  const out = [];
  document.querySelectorAll('.bg-white.rounded-\\[20px\\]').forEach((card, ci) => {
    card.querySelectorAll('img[alt]').forEach((img) => {
      const box = img.parentElement.getBoundingClientRect();
      const ir = img.getBoundingClientRect();
      if (box.width > 90) return; // 只要缩略图那一档
      out.push({
        card: ci + 1,
        alt: img.alt,
        box: [+box.width.toFixed(1), +box.height.toFixed(1)],
        img: [+ir.width.toFixed(1), +ir.height.toFixed(1)],
        fillH: +((ir.height / box.height) * 100).toFixed(1),
        fillW: +((ir.width / box.width) * 100).toFixed(1),
        overflowX: +(ir.width - box.width).toFixed(1),
        overflowY: +(ir.height - box.height).toFixed(1),
      });
    });
  });
  return out;
});
console.log(JSON.stringify(geo, null, 2));

await browser.close();
