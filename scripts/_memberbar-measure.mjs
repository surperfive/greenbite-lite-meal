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
await page.waitForTimeout(1200);
const info = await page.evaluate(() => {
  const bar = document.getElementById('home-member-bar') || document.querySelector('[class*="min-h-[34px]"]');
  const r = bar.getBoundingClientRect();
  const cs = getComputedStyle(bar);
  return { h: +r.height.toFixed(2), w: +r.width.toFixed(2), radius: cs.borderRadius, minH: cs.minHeight, py: cs.paddingTop + '/' + cs.paddingBottom };
});
console.log(JSON.stringify(info));
const bar = page.locator('#home-member-bar').first();
await bar.screenshot({ path: 'scripts/_shots/memberbar-before.png' });
await browser.close();
