import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.waitForTimeout(500);
await page.click('#nav-tab-orders');
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 15000 }).catch(() => {});
await page.waitForTimeout(900);
const g = await page.evaluate(() => {
  const ps = [...document.querySelectorAll('p')].filter(p => p.textContent.includes('牛油果鸡胸沙拉'));
  return ps.map(p => {
    const cs = getComputedStyle(p);
    return {
      text: p.textContent,
      clientW: p.clientWidth,
      scrollW: p.scrollWidth,
      truncated: p.scrollWidth > p.clientWidth + 1,
      fontSize: cs.fontSize,
      lineHeight: cs.lineHeight,
      whiteSpace: cs.whiteSpace,
      parentW: p.parentElement.clientWidth,
      textOverflow: cs.textOverflow,
    };
  });
});
console.log(JSON.stringify(g, null, 2));
await browser.close();
