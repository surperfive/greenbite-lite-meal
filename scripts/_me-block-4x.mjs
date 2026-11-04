/** 圈中组件（头像 + 昵称 + 胶囊 + 积分 + 进度条）4× 特写。 */
import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 4 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.click('#nav-tab-me');
await page.waitForTimeout(1300);
const b = await page.evaluate(() => {
  const av = document.querySelector('img[src="/mascot-avatar-hd.svg"]').parentElement.getBoundingClientRect();
  return { x: av.x - 6, y: av.y - 6, w: 300, h: av.height + 12 };
});
await page.screenshot({ path: 'scripts/_shots/me-block-4x.png', clip: { x: b.x, y: b.y, width: b.w, height: b.h } });
console.log('ok');
await browser.close();
