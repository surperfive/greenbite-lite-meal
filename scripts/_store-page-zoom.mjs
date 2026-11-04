/** 门店页局部放大：只看页头 + 说明条 + 首卡，检查字号/间距细节 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';
const OUT = 'scripts/_shots';
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 4 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.waitForTimeout(700);
await page.click('[title="点击切换门店"]');
await page.waitForSelector('[data-store-page="true"]', { timeout: 5000 });
await page.waitForTimeout(650);
const r = await page.evaluate(() => {
  const el = document.querySelector('[data-store-page="true"]');
  const b = el.getBoundingClientRect();
  return { x: b.x, y: b.y, width: b.width, height: 320 };
});
await page.screenshot({ path: `${OUT}/store-zoom-top.png`, clip: r });
await browser.close();
console.log('ok');
