import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';
fs.mkdirSync('scripts/_shots', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#nav-tab-home', { timeout: 20000 });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(2400);
await page.click('#nav-tab-gacha');
await page.waitForTimeout(2800);
await page.screenshot({ path: 'scripts/_shots/cap-gacha-375.png', clip: { x: 0, y: 0, width: 375, height: 110 } });
await page.click('#nav-tab-orders');
await page.waitForTimeout(1200);
const r = page.getByText('再来一单').first();
if (await r.count()) {
  await r.click();
  await page.waitForTimeout(1600);
  await page.screenshot({ path: 'scripts/_shots/cap-cart-375.png', clip: { x: 0, y: 0, width: 375, height: 110 } });
}
console.log('done 375');
await browser.close();
