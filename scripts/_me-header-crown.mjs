/** 头部 banner 右上角吉祥物/皇冠 特写（4×），检查缩高后有没有被顶边裁掉。 */
import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 4 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.click('#nav-tab-me');
await page.waitForTimeout(1200);
await page.screenshot({ path: 'scripts/_shots/me-header-crown-4x.png', clip: { x: 240, y: 0, width: 180, height: 130 } });
const r = await page.evaluate(() => {
  const img = document.querySelector('img[alt="我的页面头图Banner"]');
  const banner = img.closest('div.relative.overflow-hidden').getBoundingClientRect();
  const b = img.getBoundingClientRect();
  return { bannerH: +banner.height.toFixed(1), imgElH: +b.height.toFixed(1), imgElW: +b.width.toFixed(1), top: +b.top.toFixed(1) };
});
console.log(JSON.stringify(r));
await browser.close();
