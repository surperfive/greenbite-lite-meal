/** 量订单卡里「实付」与价格数字的几何关系，确定下移量。 */
import { chromium } from 'playwright';
import { BASE } from './_base.mjs';

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 4 });
await page.route('**/fonts.googleapis.com/**', (r) => r.abort());
await page.route('**/fonts.gstatic.com/**', (r) => r.abort());
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.waitForTimeout(800);
await page.click('#nav-tab-orders', { timeout: 4000 }).catch(() => {});
await page.waitForTimeout(1800);

const info = await page.evaluate(() => {
  const p = [...document.querySelectorAll('span')].find((e) => e.textContent.trim() === '实付');
  if (!p) return null;
  const row = p.parentElement;               // flex items-end gap-1
  const priceDiv = row.querySelector('div');
  const yen = priceDiv.querySelector('span');
  const num = priceDiv.querySelectorAll('span')[1];
  const box = (el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      top: +r.top.toFixed(2), bottom: +r.bottom.toFixed(2), h: +r.height.toFixed(2),
      fs: cs.fontSize, lh: cs.lineHeight, pb: cs.paddingBottom,
    };
  };
  return { row: box(row), label: box(p), priceDiv: box(priceDiv), yen: box(yen), num: box(num) };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
