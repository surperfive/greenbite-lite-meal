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
  const cards = [...document.querySelectorAll('div')].filter(d => d.textContent.includes('牛油果鸡胸沙拉'));
  const holder = [...document.querySelectorAll('div')].find(d =>
    d.children.length > 0 && [...d.children].every(c => c.tagName === 'DIV') &&
    d.textContent.includes('牛油果鸡胸沙拉') && !d.textContent.includes('今天 12:15')
  );
  const lines = holder ? [...holder.children].map(c => ({
    text: c.textContent,
    truncated: c.scrollWidth > c.clientWidth + 1,
    clientW: c.clientWidth, scrollW: c.scrollWidth,
    h: +c.getBoundingClientRect().height.toFixed(1),
  })) : [];
  return {
    lineCount: lines.length,
    lines,
    holderH: holder ? +holder.getBoundingClientRect().height.toFixed(1) : null,
    parentH: holder ? +holder.parentElement.getBoundingClientRect().height.toFixed(1) : null,
  };
});
console.log(JSON.stringify(g, null, 2));
await browser.close();
