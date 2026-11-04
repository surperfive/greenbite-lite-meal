/** 「我的」页头部两态（登录/未登录）等高校验 + 进度条存在性。 */
import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.click('#nav-tab-me');
await page.waitForTimeout(1300);

const read = () =>
  page.evaluate(() => {
    const img = document.querySelector('img[alt="我的页面头图Banner"]');
    const banner = img.closest('div.relative.overflow-hidden');
    const bb = banner.getBoundingClientRect();
    const av = document.querySelector('img[src="/mascot-avatar-hd.svg"]').parentElement.getBoundingClientRect();
    const bar = [...document.querySelectorAll('div')].find((d) => d.className.includes('h-[10px]') && d.className.includes('rounded-full'));
    const name = document.querySelector('h1');
    return {
      bannerH: +bb.height.toFixed(1),
      avatar: { top: +av.top.toFixed(1), h: +av.height.toFixed(1) },
      nameFS: getComputedStyle(name).fontSize,
      bar: bar ? { w: +bar.getBoundingClientRect().width.toFixed(1), pct: Math.round(bar.firstElementChild.getBoundingClientRect().width / bar.getBoundingClientRect().width * 100) } : null,
      scrollTop: (() => { let el = banner.parentElement; while (el) { if (el.scrollTop) return el.scrollTop; el = el.parentElement; } return 0; })(),
    };
  });

console.log('已登录', JSON.stringify(await read()));
await page.getByText('退出登录 / 切换账号').click();
await page.waitForTimeout(900);
await page.evaluate(() => {
  let el = document.querySelector('img[alt="我的页面头图Banner"]').parentElement;
  while (el) { if (el.scrollTop) { el.scrollTop = 0; break; } el = el.parentElement; }
});
await page.waitForTimeout(400);
console.log('未登录', JSON.stringify(await read()));
await browser.close();
