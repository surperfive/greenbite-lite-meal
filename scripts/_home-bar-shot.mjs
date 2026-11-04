import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const out = process.argv[2] || 'before';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 4 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.click('#nav-tab-home');
await page.waitForTimeout(1500);
const info = await page.evaluate(() => {
  const b = document.getElementById('home-member-bar');
  const r = b.getBoundingClientRect();
  const av = b.querySelector('img');
  return { bar: { w: +r.width.toFixed(2), h: +r.height.toFixed(2), top: +r.top.toFixed(1) }, avatar: av ? +av.getBoundingClientRect().height.toFixed(2) : null, radius: getComputedStyle(b).borderRadius };
});
console.log(JSON.stringify(info));
const clip = await page.evaluate(() => {
  const r = document.getElementById('home-member-bar').getBoundingClientRect();
  return { x: Math.max(0, r.left - 10), y: Math.max(0, r.top - 12), width: Math.min(r.width + 20, 430), height: r.height + 24 };
});
await page.screenshot({ path: `scripts/_shots/home-bar-${out}.png`, clip });
await browser.close();
