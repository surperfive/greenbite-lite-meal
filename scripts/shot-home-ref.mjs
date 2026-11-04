/**
 * 首页版面按参考图调整后的抓图（顶部视口，与参考图同起点便于叠比）。
 * 用法：node scripts/shot-home-ref.mjs
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { BASE } from './_base.mjs';

const OUT = 'outputs/home-ref';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
// 视口高 900：手机壳 844 全露，且底部留白不影响截图
const ctx = await browser.newContext({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 2 });
await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
const page = await ctx.newPage();

await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#nav-tab-home', { timeout: 60000 });
await page.waitForTimeout(600);
await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((x) => x.textContent?.trim() === '跳过');
  b?.click();
});
await page.waitForTimeout(900);
await page.click('#nav-tab-home');
await page.waitForTimeout(1200);
await page.evaluate(() => { window.requestAnimationFrame = () => 0; });

// 手机壳实际矩形（410 宽），只截这一段，和参考图口径一致
const box = await page.evaluate(() => {
  const shell = document.querySelector('#nav-tab-home')?.closest('div[class*="max-w-[410px]"]');
  const r = shell?.getBoundingClientRect();
  return r ? { x: r.x, y: r.y, width: r.width, height: r.height } : null;
});
console.log('shell box', JSON.stringify(box));
await page.screenshot({ path: `${OUT}/home-after.png`, clip: box ?? undefined, timeout: 60000 });
console.log('captured home-after');

// 关键元素的实测尺寸，用于和参考图对数
const m = await page.evaluate(() => {
  const q = (s) => document.querySelector(s);
  const r = (el) => (el ? el.getBoundingClientRect() : null);
  const takeout = r(q('#home-takeout-card'));
  const gacha = r(q('#home-gacha-card'));
  const bar = r(q('#home-takeout-card')?.parentElement?.parentElement?.nextElementSibling?.firstElementChild);
  const banner = r(q('#nav-tab-home')?.closest('div[class*="max-w-[410px]"]')?.querySelector('div[class*="h-[304px]"]'));
  const grid = q('#home-takeout-card')?.parentElement;
  const gs = grid ? getComputedStyle(grid) : null;
  return {
    cardW: takeout && +takeout.width.toFixed(1),
    cardH: takeout && +takeout.height.toFixed(1),
    rowGap: gacha && takeout && +(gacha.top - takeout.bottom).toFixed(1),
    colGap: gs && gs.columnGap,
    rowGapCss: gs && gs.rowGap,
    bannerH: banner && +banner.height.toFixed(1),
    barH: bar && +bar.height.toFixed(1),
    pagePadLeft: takeout && +takeout.left.toFixed(1),
  };
});
console.log('实测：', JSON.stringify(m, null, 2));

await browser.close();
