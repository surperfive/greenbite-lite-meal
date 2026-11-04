import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 3 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
try {
  await page.waitForSelector('.brand-loader__skip', { timeout: 8000 });
  await page.click('.brand-loader__skip');
  await page.waitForSelector('.brand-loader__skip', { state: 'detached', timeout: 8000 });
} catch {}
await page.waitForTimeout(1200);
await page.evaluate(() => {
  const els = [...document.querySelectorAll('.overflow-y-auto')];
  const t = els.find((e) => e.querySelector('[data-dish-thumb]'));
  t?.scrollTo(0, t.scrollHeight);
});
await page.waitForTimeout(600);
const cards = page.locator('[data-dish-thumb="true"]');
const n = await cards.count();
for (let i = 0; i < n; i++) {
  await cards.nth(i).screenshot({ path: `scripts/_lt-${i}.png` });
}
console.log('done', n);
await browser.close();
