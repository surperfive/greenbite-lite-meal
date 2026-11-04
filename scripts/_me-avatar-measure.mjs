/** 量「我的」页头像圆环的真实渲染直径（截图后按像素测，不靠 CSS 推算）。 */
import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 4 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.click('#nav-tab-me');
await page.waitForTimeout(1200);
const box = await page.evaluate(() => {
  const av = document.querySelector('img[src="/mascot-avatar-hd.svg"]').parentElement.getBoundingClientRect();
  return { x: av.x, y: av.y, w: av.width, h: av.height };
});
await page.screenshot({ path: 'scripts/_shots/me-avatar-4x.png', clip: { x: box.x - 6, y: box.y - 6, width: box.w + 12, height: box.h + 12 } });
console.log(JSON.stringify(box));
await browser.close();
