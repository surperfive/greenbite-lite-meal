import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 30000 }).catch(() => {});
await page.waitForFunction(() => {
  const s = document.getElementById('app-page-stage');
  return s && getComputedStyle(s).opacity === '1';
}, { timeout: 30000 });
await page.click('#nav-tab-home');
await page.waitForFunction(() => {
  const s = document.getElementById('app-page-stage');
  return s && getComputedStyle(s).opacity === '1';
}, { timeout: 30000 });
await page.waitForTimeout(1200);
const info = await page.evaluate(() => {
  const bar = document.getElementById('home-member-bar');
  const br = bar.getBoundingClientRect();
  // hero = 身份条所在容器（-mt 容器）的父元素里的 banner 容器
  // ⚠️ 必须量真正的 banner（aspect 容器），不能拿包着身份条的爷爷容器：
  //    它的高度已经把 -mt 抵消算进去了，会误报差一个 -mt 的量。
  // 用当前可见的 hero 图（img，h≈304）当基准，比 aspect 容器可靠
  const banner = [...document.querySelectorAll('img')]
    .find(i => i.src.includes('hero-poster') && i.getBoundingClientRect().height > 200);
  const hr = banner.getBoundingClientRect();
  return {
    barTop: +br.top.toFixed(2), barH: +br.height.toFixed(2), barCenter: +(br.top + br.height / 2).toFixed(2),
    heroBottom: +(hr.top + hr.height).toFixed(2), heroH: +hr.height.toFixed(2),
    delta: +((br.top + br.height / 2) - (hr.top + hr.height)).toFixed(2),
  };
});
console.log(JSON.stringify(info));
const bar = page.locator('#home-member-bar').first();
await bar.screenshot({ path: 'scripts/_shots/memberbar-after.png' });
await browser.close();
