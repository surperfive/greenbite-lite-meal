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
// 把点餐列表滚到底，让拿铁卡完整可见
await page.evaluate(() => {
  const els = [...document.querySelectorAll('.overflow-y-auto')];
  const t = els.find((e) => e.querySelector('[data-dish-thumb]'));
  t?.scrollTo(0, t.scrollHeight);
});
await page.waitForTimeout(600);
// 拿铁卡元素截图（完整可见状态下）
const cards = page.locator('[data-dish-thumb="true"]');
const n = await cards.count();
console.log('thumbs:', n);
await cards.nth(n - 1).screenshot({ path: 'scripts/_latte-thumb-full.png' });
// 同时截它所在的整张卡
const card = await page.evaluateHandle(() => {
  const t = document.querySelectorAll('[data-dish-thumb="true"]');
  return t[t.length - 1].closest('.group');
});
await card.asElement().screenshot({ path: 'scripts/_latte-card-full.png' });
await browser.close();
