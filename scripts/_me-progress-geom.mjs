/** 「我的」页头部：胶囊 / 积分 / 进度条 的左右端对齐与吉祥物避让校验。 */
import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 3 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.click('#nav-tab-me');
await page.waitForTimeout(1300);
const r = await page.evaluate(() => {
  const R = (e) => { const b = e.getBoundingClientRect(); return { l: +b.left.toFixed(1), r: +b.right.toFixed(1), t: +b.top.toFixed(1), b: +b.bottom.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1) }; };
  const bar = [...document.querySelectorAll('div')].find((d) => d.className.includes('h-[10px]') && d.className.includes('rounded-full'));
  const row = bar.parentElement; const pill = row.previousElementSibling.querySelector('div.inline-flex');
  const pts = row.querySelector('span.shrink-0');
  const name = document.querySelector('h1');
  const fill = bar.firstElementChild;
  const banner = document.querySelector('img[alt="我的页面头图Banner"]').closest('div.relative.overflow-hidden');
  return {
    banner: R(banner), name: R(name), pill: R(pill), pts: pts ? R(pts) : null,
    bar: R(bar), fill: R(fill), fillPct: +(fill.getBoundingClientRect().width / bar.getBoundingClientRect().width * 100).toFixed(1),
    ptsVsBarRight: pts ? +(pts.getBoundingClientRect().right - bar.parentElement.getBoundingClientRect().right).toFixed(1) : null,
  };
});
console.log(JSON.stringify(r, null, 2));
await page.screenshot({ path: 'scripts/_shots/me-header-now.png', clip: { x: 10, y: 0, width: 410, height: 170 } });
await browser.close();
