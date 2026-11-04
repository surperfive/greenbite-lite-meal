import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 4 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 30000 }).catch(() => {});
await page.waitForFunction(() => {
  const s = document.getElementById('app-page-stage');
  return s && getComputedStyle(s).opacity === '1';
}, { timeout: 30000 });
await page.click('#nav-tab-gacha');
await page.waitForFunction(() => {
  const s = document.getElementById('app-page-stage');
  return s && getComputedStyle(s).opacity === '1';
}, { timeout: 30000 });
await page.waitForTimeout(1500);
// 只截气泡本体（内部只有皇冠墨和文字墨）
const box = await page.evaluate(() => {
  const b = document.getElementById('badge-bubble').getBoundingClientRect();
  return { x: b.x + 2, y: b.y + 2, width: b.width - 4, height: b.height - 4 };
});
console.log('bubble clip', JSON.stringify(box));
await page.screenshot({ path: 'scripts/_shots/badge-bubble-ink.png', clip: box });
await browser.close();
