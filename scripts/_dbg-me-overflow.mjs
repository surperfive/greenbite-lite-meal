/**
 * 「我的」页底部溢出诊断：礼品卡（Special/Classic）是否被底部导航压住。
 * 用法：node scripts/_dbg-me-overflow.mjs
 * 输出：outputs/me-overflow/ + 控制台几何
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { BASE } from './_base.mjs';

const OUT = 'outputs/me-overflow';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 3 });
await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
const page = await ctx.newPage();

await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#nav-tab-me', { timeout: 60000 });
await page.waitForTimeout(800);
for (let i = 0; i < 25; i++) {
  if (!(await page.locator('.brand-loader').count())) break;
  await page.locator('.brand-loader__skip').click({ timeout: 1200 }).catch(() => {});
  await page.waitForTimeout(400);
}
await page.click('#nav-tab-me');
await page.waitForTimeout(1400);
for (let i = 0; i < 25; i++) {
  if (!(await page.locator('.brand-loader').count())) break;
  await page.locator('.brand-loader__skip').click({ timeout: 1200 }).catch(() => {});
  await page.waitForTimeout(400);
}

// 滚到底
const sc = page.locator('div.flex-1.min-h-0.overflow-y-auto').last();
await sc.evaluate((el) => el.scrollTo(0, el.scrollHeight));
await page.waitForTimeout(700);

const geo = await page.evaluate(() => {
  const scroller = [...document.querySelectorAll('div.overflow-y-auto')].find(
    (d) => d.querySelector('[class*="pb-28"]') || d.textContent.includes('送礼品卡')
  );
  const nav = document.getElementById('main-bottom-navigation-bar');
  const nr = nav.getBoundingClientRect();
  const root = scroller?.firstElementChild;
  const rr = root?.getBoundingClientRect();
  // 找「Special」文字所在的那张卡
  const special = [...document.querySelectorAll('span,div,p')].find((e) => e.textContent?.trim() === 'Special');
  let cardBox = null;
  let cardEl = null;
  if (special) {
    let el = special;
    for (let i = 0; i < 6 && el; i++) {
      const b = el.getBoundingClientRect();
      if (b.width > 120 && b.height > 80) {
        cardBox = { top: +b.top.toFixed(1), bottom: +b.bottom.toFixed(1), h: +b.height.toFixed(1), left: +b.left.toFixed(1), w: +b.width.toFixed(1) };
        cardEl = el.tagName + '.' + String(el.className || '').slice(0, 90);
        break;
      }
      el = el.parentElement;
    }
  }
  return {
    nav: { top: +nr.top.toFixed(1), bottom: +nr.bottom.toFixed(1), h: +nr.height.toFixed(1) },
    scroller: scroller
      ? {
          cls: String(scroller.className).slice(0, 80),
          scrollTop: Math.round(scroller.scrollTop),
          scrollHeight: scroller.scrollHeight,
          clientHeight: scroller.clientHeight,
          atBottom: Math.round(scroller.scrollTop + scroller.clientHeight) >= scroller.scrollHeight - 2,
        }
      : null,
    rootPadBottom: root ? getComputedStyle(root).paddingBottom : null,
    root: rr && { top: +rr.top.toFixed(1), bottom: +rr.bottom.toFixed(1), h: +rr.height.toFixed(1) },
    cardBox,
    cardEl,
  };
});
console.log(JSON.stringify(geo, null, 2));

await page.screenshot({ path: `${OUT}/me-bottom.png` });
await browser.close();
console.log('→', OUT);
