/**
 * 底部导航「切内容」A/B：同一滚动位置、同一视口（390×760 真机尺寸），
 * 先拍当前代码（实心白 + 上沿渐隐），再用注入样式还原旧版（bg-white/95 + blur、无渐隐）。
 * 用法：node scripts/_ab-nav-cut.mjs
 * 输出：outputs/nav-ab/{after,before}.png + -crop.png
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { BASE } from './_base.mjs';

const OUT = 'outputs/nav-ab';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 390, height: 760 }, deviceScaleFactor: 3 });
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

// 滚到礼品卡正好跨在导航上沿：卡片顶 = 导航顶 - 60
const pos = await page.evaluate(() => {
  const scroller = [...document.querySelectorAll('div.overflow-y-auto')].find(
    (d) => d.textContent.includes('送礼品卡') && d.scrollHeight > d.clientHeight + 4
  );
  const nav = document.getElementById('main-bottom-navigation-bar');
  const navTop = nav.getBoundingClientRect().top;
  const head = [...scroller.querySelectorAll('h3')].find((e) => e.textContent?.trim() === '送礼品卡');
  scroller.scrollTop += head.getBoundingClientRect().top - (navTop - 60);
  return {
    scrollTop: Math.round(scroller.scrollTop),
    max: scroller.scrollHeight - scroller.clientHeight,
    navTop: +navTop.toFixed(1),
  };
});
await page.waitForTimeout(600);
await killLoader();
console.log('scroll:', JSON.stringify(pos));

const shot = async (tag) => {
  await page.screenshot({ path: `${OUT}/${tag}.png` });
  await page.screenshot({
    path: `${OUT}/${tag}-crop.png`,
    clip: { x: 0, y: 640, width: 390, height: 120 },
  });
};

await shot('after');

// 还原旧版：半透明 + 模糊 + 干掉上沿渐隐
await page.evaluate(() => {
  const nav = document.getElementById('main-bottom-navigation-bar');
  nav.style.backgroundColor = 'rgba(255,255,255,0.95)';
  nav.style.backdropFilter = 'blur(12px)';
  const grad = nav.querySelector('div[aria-hidden="true"]');
  if (grad) grad.style.display = 'none';
});
await page.waitForTimeout(300);
await shot('before');

await browser.close();
console.log('→', OUT);
