import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 3 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.click('#nav-tab-me');
await page.waitForTimeout(1200);
await page.evaluate(() => {
  const t = [...document.querySelectorAll('button,div[role="button"]')].find(e => (e.textContent || '').includes('健康计划'));
  t && t.click();
});
await page.waitForTimeout(900);
const m = await page.evaluate(() => {
  const b = document.querySelector('[role="dialog"] .z-20.pointer-events-none.absolute');
  if (!b) return { badge: false };
  const cs = getComputedStyle(b);
  const hl = b.querySelector('span[aria-hidden="true"]');
  const icon = b.querySelector('svg');
  return {
    badge: true,
    size: [cs.width, cs.height], radius: cs.borderRadius, border: cs.borderTopWidth,
    hlInset: getComputedStyle(hl).top, hlRadius: getComputedStyle(hl).borderTopLeftRadius,
    icon: icon ? getComputedStyle(icon).width : null,
  };
});
console.log(JSON.stringify(m));
const box = await page.evaluate(() => {
  const b = document.querySelector('[role="dialog"] .z-20.pointer-events-none.absolute');
  const r = b.getBoundingClientRect();
  return { x: r.x - 10, y: r.y - 10, width: r.width + 120, height: r.height + 26 };
});
await page.screenshot({ path: 'scripts/_shots/other-badge.png', clip: box });
await browser.close();
