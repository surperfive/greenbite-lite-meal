/** 「我的」页头部：黑胶囊量表 + 右端积分 的几何校验。 */
import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 4 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.click('#nav-tab-me');
await page.waitForTimeout(1300);
const r = await page.evaluate(() => {
  const R = (e) => { const b = e.getBoundingClientRect(); return { l: +b.left.toFixed(1), r: +b.right.toFixed(1), t: +b.top.toFixed(1), b: +b.bottom.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1) }; };
  const track = [...document.querySelectorAll('div')].find((d) => d.className.includes('h-[10px]') && d.className.includes('rounded-full'));
  const fill = track.firstElementChild;
  const row = track.parentElement;
  const pts = row.querySelector('span.shrink-0');
  const pill = row.previousElementSibling.querySelector('div.inline-flex');
  const name = document.querySelector('h1');
  const col = track.closest('.flex-1.min-w-0');
  const banner = document.querySelector('img[alt="我的页面头图Banner"]').closest('div.relative.overflow-hidden');
  const av = document.querySelector('img[src="/mascot-avatar-hd.svg"]').parentElement;
  return {
    banner: R(banner), avatar: R(av), name: R(name), pill: R(pill),
    track: R(track), fill: R(fill), pts: R(pts), col: R(col),
    fillPct: +(fill.getBoundingClientRect().width / track.getBoundingClientRect().width * 100).toFixed(1),
    ptsRightVsColRight: +(pts.getBoundingClientRect().right - col.getBoundingClientRect().right).toFixed(1),
    blockH: +(track.getBoundingClientRect().bottom - name.getBoundingClientRect().top).toFixed(1),
  };
});
console.log(JSON.stringify(r, null, 2));
const clip = await page.evaluate(() => {
  const av = document.querySelector('img[src="/mascot-avatar-hd.svg"]').parentElement.getBoundingClientRect();
  return { x: av.x - 6, y: av.y - 6, width: 300, height: av.height + 12 };
});
await page.screenshot({ path: 'scripts/_shots/me-gauge-4x.png', clip });
await browser.close();
