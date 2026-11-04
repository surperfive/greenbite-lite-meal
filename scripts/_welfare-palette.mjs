import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';
fs.mkdirSync('scripts/_shots', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#nav-tab-home', { timeout: 20000 });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(2200);
await page.click('#nav-tab-home');
await page.waitForTimeout(1200);
await page.click('#home-benefit-card');
await page.waitForTimeout(1600);
await page.screenshot({ path: 'scripts/_shots/welfare-palette.png', clip: { x: 0, y: 0, width: 430, height: 932 } });
// 只截弹窗本体
const box = await page.evaluate(() => {
  const el = document.querySelector('.wf-card') || document.querySelector('.wf-tilt');
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: Math.max(0, r.left - 30), y: Math.max(0, r.top - 70), width: Math.min(430, r.width + 60), height: Math.min(932, r.height + 90) };
});
if (box) {
  await page.screenshot({ path: 'scripts/_shots/welfare-card.png', clip: { x: box.x, y: box.y, width: box.width, height: box.height } });
  console.log('card clip', JSON.stringify(box));
}
console.log('ok');
await browser.close();
