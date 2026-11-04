/** 全站各页顶部 130px 截图：看右上角有没有会被「小程序胶囊」撞到的元素。 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';
fs.mkdirSync('scripts/_shots', { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#nav-tab-home', { timeout: 20000 });
await page.waitForTimeout(2000);

for (const tab of ['home', 'menu', 'orders', 'me', 'gacha']) {
  await page.click(`#nav-tab-${tab}`);
  await page.waitForTimeout(tab === 'gacha' ? 2600 : 1400);
  await page.screenshot({ path: `scripts/_shots/top-${tab}.png`, clip: { x: 0, y: 0, width: 430, height: 130 } });
  console.log('shot', tab);
}
await browser.close();
