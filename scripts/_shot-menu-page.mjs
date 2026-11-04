import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 2 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
try {
  await page.waitForSelector('.brand-loader__skip', { timeout: 8000 });
  await page.click('.brand-loader__skip');
  await page.waitForSelector('.brand-loader__skip', { state: 'detached', timeout: 8000 });
} catch {}
await page.waitForTimeout(1200);
// 滚到点餐列表，截整页
const sc = await page.evaluate(() => {
  const els = [...document.querySelectorAll('.overflow-y-auto')];
  const t = els.find((e) => e.querySelector('[data-dish-thumb]'));
  t?.scrollTo(0, 0);
  return !!t;
});
await page.waitForTimeout(400);
await page.screenshot({ path: 'scripts/_menu-page-full.png', fullPage: false });
console.log('saved, scroller found:', sc);
await browser.close();
