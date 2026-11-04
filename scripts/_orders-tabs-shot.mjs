import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 4 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.click('#nav-tab-orders');
await page.waitForTimeout(1400);
const info = await page.evaluate(() => {
  const tabs = [...document.querySelectorAll('button')].filter((b) => /^(全部|进行中|已完成)/.test(b.textContent.trim()));
  return tabs.map((b) => ({ t: b.textContent.trim(), h: b.offsetHeight, w: +b.getBoundingClientRect().width.toFixed(2) }));
});
console.log(JSON.stringify(info));
const clip = await page.evaluate(() => {
  const tabs = [...document.querySelectorAll('button')].filter((b) => /^(全部|进行中|已完成)/.test(b.textContent.trim()));
  const a = tabs[0].getBoundingClientRect(), z = tabs[tabs.length - 1].getBoundingClientRect();
  return { x: a.left - 10, y: a.top - 10, width: z.right - a.left + 20, height: a.height + 20 };
});
await page.screenshot({ path: 'scripts/_shots/orders-tabs-noCount.png', clip });
await browser.close();
