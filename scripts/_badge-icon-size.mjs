import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 4 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.click('#nav-tab-gacha');
await page.waitForTimeout(1500);
await page.click('#btn-header-info');
await page.waitForSelector('[role="dialog"]', { timeout: 4000 });
await page.waitForTimeout(900);

const sizes = [20, 24, 26, 28];
for (const s of sizes) {
  const box = await page.evaluate((sz) => {
    const badge = document.querySelector('[role="dialog"] [class*="h-[52px]"]');
    const svg = badge.querySelector('svg');
    svg.style.width = sz + 'px';
    svg.style.height = sz + 'px';
    const r = badge.getBoundingClientRect();
    return { x: r.x - 4, y: r.y - 4, width: r.width + 8, height: r.height + 8 };
  }, s);
  await page.waitForTimeout(150);
  await page.screenshot({ path: `scripts/_shots/badge-${s}.png`, clip: box });
  console.log('shot', s);
}
await browser.close();
