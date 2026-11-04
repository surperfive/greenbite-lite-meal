/** 参考（首页身份条）vs 应用（我的页头部）—— 两张都用同一 3× 缩放，便于对照信息结构。 */
import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 3 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });

// 参考：首页身份条
await page.click('#nav-tab-home');
await page.waitForTimeout(1600);
const bar = await page.evaluate(() => {
  const b = document.getElementById('home-member-bar').getBoundingClientRect();
  return { x: b.x - 6, y: b.y - 6, width: b.width + 12, height: b.height + 12 };
});
await page.screenshot({ path: 'scripts/_shots/ref-memberbar.png', clip: bar });

// 应用：我的页头部圈中组件
await page.click('#nav-tab-me');
await page.waitForTimeout(1400);
const blk = await page.evaluate(() => {
  const av = document.querySelector('img[src="/mascot-avatar-hd.svg"]').parentElement.getBoundingClientRect();
  return { x: av.x - 6, y: av.y - 6, width: 300, height: av.height + 12 };
});
await page.screenshot({ path: 'scripts/_shots/applied-meblock.png', clip: blk });
console.log('ok');
await browser.close();
