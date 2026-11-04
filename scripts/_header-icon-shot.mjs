import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 30000 }).catch(() => {});
await page.waitForFunction(() => {
  const s = document.getElementById('app-page-stage');
  return s && getComputedStyle(s).opacity === '1';
}, { timeout: 30000 });
await page.click('#nav-tab-home');
await page.waitForFunction(() => {
  const s = document.getElementById('app-page-stage');
  return s && getComputedStyle(s).opacity === '1';
}, { timeout: 30000 });
await page.waitForTimeout(1500);
const box = await page.evaluate(() => {
  const h3 = [...document.querySelectorAll('h3')].find(e => e.textContent.includes('人气当季轻食'));
  const icon = h3.previousElementSibling || h3.parentElement.querySelector('div');
  const r = icon.getBoundingClientRect();
  return { x: Math.max(0, r.x - 10), y: Math.max(0, r.y - 10), width: r.width + 20, height: r.height + 20 };
});
console.log(JSON.stringify(box));
await page.screenshot({ path: 'scripts/_shots/header-icon.png', clip: box });
await browser.close();
