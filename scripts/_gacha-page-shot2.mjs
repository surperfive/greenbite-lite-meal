/** 抽卡页整页截图（页头改动后确认没破坏下面的布局）。 */
import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#nav-tab-gacha', { timeout: 20000 });
await page.waitForTimeout(600);
await page.click('#nav-tab-gacha');
await page.waitForSelector('#unified-pantry-big-card', { timeout: 15000 });
await page.waitForTimeout(2600);
await page.screenshot({ path: 'scripts/_shots/gacha-page-after.png' });
console.log('ok');
await browser.close();
