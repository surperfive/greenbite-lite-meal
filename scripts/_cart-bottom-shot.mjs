/**
 * 确认订单页：滚到底 + 顶部，各截一张，检查底部条是否压住内容
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';
const OUT = 'scripts/_shots';
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 4 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.waitForTimeout(600);
await page.click('#nav-tab-orders');
await page.waitForTimeout(900);
const reorder = page.getByText('再来一单', { exact: true }).first();
await reorder.waitFor({ state: 'visible', timeout: 10000 });
await reorder.click();
await page.waitForTimeout(1600);

// 滚到底
const sc = await page.evaluate(() => {
  const el = [...document.querySelectorAll('div')].find(
    (d) => d.scrollHeight > d.clientHeight + 20 && getComputedStyle(d).overflowY === 'auto'
  );
  if (!el) return null;
  el.scrollTop = el.scrollHeight;
  return { sh: el.scrollHeight, ch: el.clientHeight, top: el.scrollTop };
});
console.log('scroll', sc);
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/cart-bottom.png` });

// 底部条与最后一张卡的间距
const gap = await page.evaluate(() => {
  const bar = [...document.querySelectorAll('div')].find((d) =>
    d.className.includes('bottom-[72px]')
  );
  const b = bar?.getBoundingClientRect();
  const cards = [...document.querySelectorAll('.rounded-2xl')];
  const last = cards[cards.length - 1]?.getBoundingClientRect();
  return {
    bar: b ? { top: +b.top.toFixed(1), h: +b.height.toFixed(1) } : null,
    lastCard: last ? { top: +last.top.toFixed(1), bottom: +last.bottom.toFixed(1) } : null,
    overlap: b && last ? +(b.top - last.bottom).toFixed(1) : null,
  };
});
console.log(JSON.stringify(gap, null, 2));
await browser.close();
