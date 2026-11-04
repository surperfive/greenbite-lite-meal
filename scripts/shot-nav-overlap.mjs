/**
 * 底部导航与内容「相切」处的观感：把「送礼品卡」那一排滚到导航上沿附近再拍。
 * 用法：node scripts/shot-nav-overlap.mjs before|after
 * 输出：outputs/nav-overlap/<tag>.png（整屏）+ <tag>-crop.png（底部 120px，接近用户截图）
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { BASE } from './_base.mjs';

const TAG = process.argv[2] ?? 'shot';
const OUT = 'outputs/nav-overlap';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 3 });
await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
const page = await ctx.newPage();

const killLoader = async () => {
  for (let i = 0; i < 25; i++) {
    if (!(await page.locator('.brand-loader').count())) return;
    await page.locator('.brand-loader__skip').click({ timeout: 1200 }).catch(() => {});
    await page.waitForTimeout(400);
  }
};

await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#nav-tab-me', { timeout: 60000 });
await page.waitForTimeout(700);
await killLoader();
await page.click('#nav-tab-me');
await page.waitForTimeout(1500);
await killLoader();

// 把「送礼品卡」这一块滚到正好压在导航上沿附近
const info = await page.evaluate(() => {
  // 只认真能滚的那个容器（scrollHeight > clientHeight），页面里有多层 overflow-y-auto
  const scroller = [...document.querySelectorAll('div.overflow-y-auto')].find(
    (d) => d.textContent.includes('送礼品卡') && d.scrollHeight > d.clientHeight + 4
  );
  const nav = document.getElementById('main-bottom-navigation-bar');
  const navTop = nav.getBoundingClientRect().top;
  const head = [...scroller.querySelectorAll('h3,h2,div,span,p')].find(
    (e) => e.textContent?.trim() === '送礼品卡'
  );
  const headTop = head.getBoundingClientRect().top;
  // 让「送礼品卡」标题出现在导航上沿上方 70px 处 → 礼品卡正好压进导航里
  scroller.scrollTop += headTop - (navTop - 70);
  return { scrollTop: scroller.scrollTop, max: scroller.scrollHeight - scroller.clientHeight, navTop };
});
await page.waitForTimeout(600);
await killLoader();

console.log('scroll:', JSON.stringify(info));
await page.screenshot({ path: `${OUT}/${TAG}.png` });
await page.screenshot({
  path: `${OUT}/${TAG}-crop.png`,
  clip: { x: 0, y: 780, width: 420, height: 120 },
});

// 顺带量：导航类型、背景透明度、模糊、上方是否有渐隐层
const probe = await page.evaluate(() => {
  const nav = document.getElementById('main-bottom-navigation-bar');
  const cs = getComputedStyle(nav);
  const r = nav.getBoundingClientRect();
  return {
    position: cs.position,
    bg: cs.backgroundColor,
    backdrop: cs.backdropFilter,
    radiusTop: cs.borderTopLeftRadius,
    h: +r.height.toFixed(1),
    top: +r.top.toFixed(1),
    prevSibling: nav.previousElementSibling
      ? nav.previousElementSibling.tagName +
        '.' +
        String(nav.previousElementSibling.className).slice(0, 70)
      : null,
  };
});
console.log('nav:', JSON.stringify(probe, null, 2));

await browser.close();
console.log('→', OUT);
