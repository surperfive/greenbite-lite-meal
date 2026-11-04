/** 胶囊居中改造后的整页目视检查：首页 / 点餐 / 订单 各一张。 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';
const OUT = 'scripts/_shots';
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 3 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
for (const tab of ['menu', 'orders', 'home']) {
  await page.click(`#nav-tab-${tab}`);
  await page.waitForTimeout(1100);
  await page.screenshot({ path: `${OUT}/pill-after-${tab}.png` });
}
await browser.close();
console.log('done');
