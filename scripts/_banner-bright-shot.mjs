import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.waitForTimeout(1200);
const info = await page.evaluate(() => {
  const c = document.getElementById('menu-header-banner');
  const img = document.getElementById('menu-banner-image');
  const r = c.getBoundingClientRect();
  return { w: +r.width.toFixed(1), h: +r.height.toFixed(1), loaded: img.complete && img.naturalWidth > 0 };
});
console.log(JSON.stringify(info));
await page.screenshot({ path: 'scripts/_shots/banner-bright.png', clip: { x: 0, y: 0, width: 430, height: 140 } });
await browser.close();
