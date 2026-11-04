import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const LEVELS = [12, 20, 24, 28];
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.click('#nav-tab-orders');
await page.waitForTimeout(1300);
const ok = await page.evaluate(() => {
  const el = document.querySelector('.sticky.top-0.z-20');
  if (!el) return false;
  el.id = 'op-head';
  return true;
});
console.log('header tagged', ok);
for (const pt of LEVELS) {
  await page.evaluate((v) => {
    document.getElementById('ab3')?.remove();
    const s = document.createElement('style');
    s.id = 'ab3';
    s.textContent = `#op-head{padding-top:${v}px!important}`;
    document.head.appendChild(s);
  }, pt);
  await page.waitForTimeout(180);
  await page.screenshot({ path: `scripts/_shots/orders-top-${pt}.png`, clip: { x: 0, y: 0, width: 430, height: 230 } });
}
await browser.close();
