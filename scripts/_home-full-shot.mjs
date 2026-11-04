/** 首页整页截图（滚动拼接）—— 换封面后确认布局没塌 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';
const OUT = 'scripts/_shots';
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.waitForTimeout(700);
await page.click('#nav-tab-home');
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 15000 }).catch(() => {});
await page.waitForTimeout(1000);
const clip = await page.evaluate(() => {
  const stage = document.getElementById('app-page-stage');
  const b = stage.parentElement.getBoundingClientRect();
  return { x: b.x, y: b.y, width: b.width, height: b.height };
});
await page.screenshot({ path: `${OUT}/home-top.png`, clip });
// 滚到底看人气区下面
await page.evaluate(() => {
  const sc = document.querySelector('#app-page-stage .overflow-y-auto');
  if (sc) sc.scrollTop = sc.scrollHeight;
});
await page.waitForTimeout(800);
await page.screenshot({ path: `${OUT}/home-bottom.png`, clip });
console.log('ok');
await browser.close();
