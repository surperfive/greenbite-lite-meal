import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 8 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.click('#nav-tab-home');
await page.waitForTimeout(1500);
const clip = await page.evaluate(() => {
  const bar = document.getElementById('home-member-bar');
  const img = bar.querySelector('img');
  const r = img.getBoundingClientRect();
  return { x: r.left - 6, y: r.top - 6, width: r.width + 12, height: r.height + 12 };
});
console.log(JSON.stringify(clip));
await page.screenshot({ path: 'scripts/_shots/avatar-zoom8.png', clip });
await browser.close();
