import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.click('#nav-tab-menu');
await page.waitForTimeout(1500);
const info = await page.evaluate(() => {
  const c = document.getElementById('menu-header-banner');
  const img = document.getElementById('menu-banner-image');
  const r = c.getBoundingClientRect();
  return { banner: { w: +r.width.toFixed(1), h: +r.height.toFixed(1) }, imgLoaded: img.complete && img.naturalWidth > 0, natural: [img.naturalWidth, img.naturalHeight] };
});
console.log(JSON.stringify(info));
await page.screenshot({ path: 'scripts/_shots/menu-banner-new.png', clip: { x: 0, y: 0, width: 430, height: 300 } });
await browser.close();
