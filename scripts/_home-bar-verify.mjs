import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.click('#nav-tab-home');
await page.waitForTimeout(1500);

const measure = () => page.evaluate(() => {
  const bar = document.getElementById('home-member-bar');
  const r = bar.getBoundingClientRect();
  // hero：bar 的爷爷容器（含 banner）
  let hero = bar.parentElement?.parentElement;
  const hr = hero.getBoundingClientRect();
  return {
    barH: +r.height.toFixed(2),
    barTop: +r.top.toFixed(1),
    barCenter: +(r.top + r.height / 2).toFixed(2),
    heroBottom: +hr.bottom.toFixed(2),
    delta: +((r.top + r.height / 2) - hr.bottom).toFixed(2),
    inner: [...bar.querySelectorAll('img, span, svg')].length,
  };
});
console.log('登录态 ', JSON.stringify(await measure()));

// 未登录态
await page.click('#nav-tab-me');
await page.waitForTimeout(900);
await page.evaluate(() => { const sc = document.querySelector('.overflow-y-auto'); if (sc) sc.scrollTop = 99999; });
await page.waitForTimeout(500);
await page.getByRole('button', { name: /退出登录/ }).click();
await page.waitForTimeout(900);
await page.click('#nav-tab-home');
await page.waitForTimeout(1200);
console.log('未登录态', JSON.stringify(await measure()));

// 首屏是否仍露出四张入口卡
const cards = await page.evaluate(() => {
  const els = [...document.querySelectorAll('img')].filter((i) => /entry-norm/.test(i.getAttribute('src') || ''));
  return els.map((i) => +i.getBoundingClientRect().bottom.toFixed(1));
});
console.log('入口插画底边（视口高 932）', JSON.stringify(cards));
await page.screenshot({ path: 'scripts/_shots/home-after-shrink.png' });
await browser.close();
