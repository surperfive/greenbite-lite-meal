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
const m = await page.evaluate(() => {
  const badge = document.querySelector('[role="dialog"] .z-20.pointer-events-none.absolute');
  const svg = badge.querySelector('svg');
  const cs = getComputedStyle(badge);
  const r = badge.getBoundingClientRect();
  return {
    stickerCss: [cs.width, cs.height, cs.borderRadius, cs.borderTopWidth],
    iconCss: getComputedStyle(svg).width,
    bbox: [+r.width.toFixed(1), +r.height.toFixed(1)],
  };
});
console.log(JSON.stringify(m));
const box = await page.evaluate(() => {
  const badge = document.querySelector('[role="dialog"] .z-20.pointer-events-none.absolute');
  const r = badge.getBoundingClientRect();
  return { x: r.x - 12, y: r.y - 12, width: r.width + 170, height: r.height + 30 };
});
await page.screenshot({ path: 'scripts/_shots/badge-final2.png', clip: box });
await page.screenshot({ path: 'scripts/_shots/badge-ctx2.png', clip: { x: 0, y: 150, width: 430, height: 250 } });
await browser.close();
