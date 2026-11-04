/** 订单卡整卡 4×，看清「实付 ¥xx」在卡内的垂直位置。 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';
const OUT = 'scripts/_shots';
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 4 });
await page.route('**/fonts.googleapis.com/**', (r) => r.abort());
await page.route('**/fonts.gstatic.com/**', (r) => r.abort());
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.waitForTimeout(800);
await page.click('#nav-tab-orders', { timeout: 4000 }).catch(() => {});
await page.waitForTimeout(1800);
const clip = await page.evaluate(() => {
  const p = [...document.querySelectorAll('span')].find((e) => e.textContent.trim() === '实付');
  const row = p.closest('div.flex.items-center');
  const card = row.parentElement;                     // 整卡（含青柠店头 + 状态条）
  const b = card.getBoundingClientRect();
  return { x: b.x, y: b.y, width: b.width, height: b.height };
});
await page.screenshot({ path: `${OUT}/order-card-4x.png`, clip });
console.log(JSON.stringify(clip));
await browser.close();
