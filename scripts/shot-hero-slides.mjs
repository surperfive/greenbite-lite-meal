import { chromium } from 'playwright';
import { BASE } from './_base.mjs';

const OUT = process.argv[2] ?? 'outputs/hero-slides';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 3 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#app-loading-screen', { state: 'attached', timeout: 10000 }).catch(() => {});
await page.waitForSelector('#app-loading-screen', { state: 'detached', timeout: 25000 });
await page.waitForTimeout(400);
await page.click('#nav-tab-home');
await page.waitForTimeout(1800);

const hero = page.locator('div.relative.w-full.h-\\[304px\\]').first();
const total = await page.locator('button[aria-label^="切换到第"]').count();
for (let i = 0; i < total; i++) {
  await page.locator('button[aria-label^="切换到第"]').nth(i).click();
  await page.waitForTimeout(900);
  await hero.screenshot({ path: `${OUT}/slide-${i + 1}.png` });
}
console.log('captured', total);
await browser.close();
