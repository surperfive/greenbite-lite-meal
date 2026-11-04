/**
 * 截取「我的」页滚动到底部的视图（底部导航会遮住送礼卡标签，需要单独确认）。
 * 用法：node scripts/shot-me-bottom.mjs
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { BASE } from './_base.mjs';

const OUT = 'probe-out/me-ref';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({
  viewport: { width: 420, height: 900 },
  deviceScaleFactor: 2
});
const page = await ctx.newPage();

await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(600);
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === '跳过');
  btn?.click();
});
await page.waitForTimeout(900);

await page.click('#nav-tab-me');
await page.waitForTimeout(1000);

// 找到可滚动的容器并滚到底
await page.evaluate(() => {
  const all = [...document.querySelectorAll('*')];
  const scroller = all.find(
    (el) => el.scrollHeight > el.clientHeight + 40 && /auto|scroll/.test(getComputedStyle(el).overflowY)
  );
  if (scroller) scroller.scrollTop = scroller.scrollHeight;
  else window.scrollTo(0, document.body.scrollHeight);
});
await page.waitForTimeout(600);

await page.screenshot({ path: `${OUT}/mine-bottom.png` });
console.log('captured mine-bottom.png');

await browser.close();
console.log(`\n输出目录：${OUT}`);
