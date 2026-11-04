/** 订单价格「下移前 / 下移后」A/B + 墨迹实测。
 *  源码已加 translate-y-[2px]；"下移前"那张靠 JS 清掉 translate 得到，同帧只差位移。 */
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

const clip = await page.evaluate(() => {
  const p = [...document.querySelectorAll('span')].find((e) => e.textContent.trim() === '实付');
  const row = p.parentElement;
  const b = row.getBoundingClientRect();
  // 往左多留 150px，把菜名/时间两行也框进来，才看得出"相对谁"下移
  return { x: b.x - 150, y: b.y - 12, width: b.width + 158, height: b.height + 26 };
});

// 后（源码现状）
await page.screenshot({ path: `${OUT}/order-price-after.png`, clip });

// 前（清掉位移）
const n = await page.evaluate(() => {
  const p = [...document.querySelectorAll('span')].find((e) => e.textContent.trim() === '实付');
  const row = p.parentElement;
  row.style.translate = 'none';
  return getComputedStyle(row).translate;
});
console.log('清掉位移后 translate =', n);
await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}/order-price-before.png`, clip });
console.log('ok');
await browser.close();
