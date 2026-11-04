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
  const badge = document.querySelector('[role="dialog"] [class*="h-[52px]"]');
  const svg = badge.querySelector('svg');
  const b = badge.getBoundingClientRect();
  const s = svg.getBoundingClientRect();
  return {
    iconCss: +s.width.toFixed(1),
    badge: { w: +b.width.toFixed(1), h: +b.height.toFixed(1) },
    gapX: +((b.width - s.width) / 2).toFixed(1),
    gapY: +((b.height - s.height) / 2).toFixed(1),
  };
});
console.log(JSON.stringify(m));
const box = await page.evaluate(() => {
  const badge = document.querySelector('[role="dialog"] [class*="h-[52px]"]');
  const r = badge.getBoundingClientRect();
  return { x: r.x - 6, y: r.y - 6, width: r.width + 12, height: r.height + 12 };
});
await page.screenshot({ path: 'scripts/_shots/badge-icon-final.png', clip: box });
await page.screenshot({ path: 'scripts/_shots/badge-icon-ctx.png', clip: { x: 0, y: 150, width: 430, height: 260 } });
await browser.close();
