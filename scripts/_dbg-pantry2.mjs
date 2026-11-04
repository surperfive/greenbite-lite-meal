import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 } });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.waitForTimeout(600);
await page.click('#nav-tab-gacha');
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 15000 }).catch(() => {});
await page.waitForSelector('#btn-category-select-all-pill', { state: 'visible', timeout: 15000 });
await page.waitForTimeout(900);
const info = await page.evaluate(() => {
  const badges = [...document.querySelectorAll('span.rounded-full')].filter(
    (s) => typeof s.className === 'string' && s.className.includes('w-3.5')
  );
  const mapped = badges.map((s) => {
    const b = s.closest('button');
    return { tag: b?.tagName ?? null, id: b?.id ?? null, cls: (b?.className || '').slice(0, 40) };
  });
  return { badgeCount: badges.length, mapped };
});
console.log(JSON.stringify(info, null, 1));
await browser.close();
