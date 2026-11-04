/** 订单卡价格行 8× 特写 + 墨迹实测（实付 / ¥ / 数字 三段分开量）。 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';
const OUT = 'scripts/_shots';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 8 });
await page.route('**/fonts.googleapis.com/**', (r) => r.abort());
await page.route('**/fonts.gstatic.com/**', (r) => r.abort());
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.waitForTimeout(800);
await page.click('#nav-tab-orders', { timeout: 4000 }).catch(() => {});
await page.waitForTimeout(1800);

const geo = await page.evaluate(() => {
  const p = [...document.querySelectorAll('span')].find((e) => e.textContent.trim() === '实付');
  const row = p.parentElement;
  const r = row.getBoundingClientRect();
  // 菜品图（左）与整行卡片，用来判断价格在卡内的垂直位置
  const img = row.closest('div.flex-1')?.parentElement?.querySelector('img, [data-dish-thumb]');
  const ib = img?.getBoundingClientRect();
  return {
    row: { x: +r.x.toFixed(2), y: +r.y.toFixed(2), w: +r.width.toFixed(2), h: +r.height.toFixed(2) },
    img: ib ? { y: +ib.y.toFixed(2), bottom: +ib.bottom.toFixed(2), h: +ib.height.toFixed(2) } : null,
  };
});
console.log(JSON.stringify(geo, null, 2));

const clip = { x: geo.row.x - 4, y: geo.row.y - 6, width: geo.row.w + 8, height: geo.row.h + 12 };
await page.screenshot({ path: `${OUT}/order-price-8x.png`, clip });
console.log('ok');
await browser.close();
