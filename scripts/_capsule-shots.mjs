/** 全局胶囊落位观感截图：首页 / 抽卡 / 购物车 / 收藏页头部。 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';
fs.mkdirSync('scripts/_shots', { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#nav-tab-home', { timeout: 20000 });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(2400);

// ⚠️ App 默认落在点餐页，先点首页
await page.click('#nav-tab-home');
await page.waitForTimeout(1400);

// 首页：先掐掉轮播自动跳，避免截到半张
await page.evaluate(() => {
  for (let i = 1; i < 9999; i++) window.clearInterval(i);
});
await page.screenshot({ path: 'scripts/_shots/cap-home.png', clip: { x: 0, y: 0, width: 430, height: 220 } });
await page.screenshot({ path: 'scripts/_shots/cap-home-full.png', clip: { x: 0, y: 0, width: 430, height: 620 } });
console.log('shot home');

await page.click('#nav-tab-gacha');
await page.waitForTimeout(2800);
await page.screenshot({ path: 'scripts/_shots/cap-gacha.png', clip: { x: 0, y: 0, width: 430, height: 150 } });
console.log('shot gacha');

await page.click('#nav-tab-orders');
await page.waitForTimeout(1200);
const reorder = page.getByText('再来一单').first();
if (await reorder.count()) {
  await reorder.click();
  await page.waitForTimeout(1400);
  await page.screenshot({ path: 'scripts/_shots/cap-cart.png', clip: { x: 0, y: 0, width: 430, height: 150 } });
  console.log('shot cart');
}

await browser.close();
