import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 30000 }).catch(() => {});
await page.waitForFunction(() => {
  const s = document.getElementById('app-page-stage');
  const img = document.getElementById('menu-banner-image');
  return s && getComputedStyle(s).opacity === '1' && img && img.complete && img.naturalWidth > 0;
}, { timeout: 30000 });
await page.waitForTimeout(1000);
await page.screenshot({ path: 'scripts/_shots/banner-bright.png', clip: { x: 0, y: 0, width: 430, height: 110 } });
await browser.close();
