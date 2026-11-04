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

const cases = [
  { k: 'A', bw: 2.75, label: '2.75 (当前)' },
  { k: 'B', bw: 3.5, label: '3.5' },
  { k: 'C', bw: 4, label: '4' },
  { k: 'D', bw: 4.5, label: '4.5' },
];
for (const c of cases) {
  const box = await page.evaluate((c) => {
    const badge = document.querySelector('[role="dialog"] .z-20.pointer-events-none.absolute');
    badge.style.borderWidth = c.bw + 'px';
    const r = badge.getBoundingClientRect();
    return { x: r.x - 12, y: r.y - 12, width: r.width + 150, height: r.height + 26 };
  }, c);
  await page.waitForTimeout(200);
  await page.screenshot({ path: `scripts/_shots/bw-${c.k}.png`, clip: box });
  console.log(c.k, c.label);
}
await browser.close();
