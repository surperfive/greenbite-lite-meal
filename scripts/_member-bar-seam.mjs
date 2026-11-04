/** 身份条「骑缝」校验：卡片垂直中心必须落在 hero 海报底边上（容差 1px）。
 *  同时量：卡高 / 与下面四宫格的间距 / 首屏四张入口卡是否仍完整。
 *  用法：BASE_URL=http://localhost:5180 node scripts/_member-bar-seam.mjs */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';
const OUT = 'scripts/_shots';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 3 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.click('#nav-tab-home');
await page.waitForTimeout(1600);

const m = await page.evaluate(() => {
  const bar = document.getElementById('home-member-bar');
  const b = bar.getBoundingClientRect();
  // hero = 身份条所在的外层容器里那个 banner（BannerSlider 的最外层）
  const heroWrap = bar.closest('.relative.z-10')?.parentElement;
  const hero = heroWrap?.querySelector('div:not(.relative)') || heroWrap?.firstElementChild;
  const hb = hero.getBoundingClientRect();
  // 四宫格：第一个入口卡
  const entry = document.querySelector('[data-entry-card]') || null;
  const eb = entry?.getBoundingClientRect() || null;
  return {
    bar: { top: +b.top.toFixed(2), bottom: +b.bottom.toFixed(2), h: +b.height.toFixed(2), cx: +b.width.toFixed(2) },
    hero: { top: +hb.top.toFixed(2), bottom: +hb.bottom.toFixed(2), h: +hb.height.toFixed(2) },
    barCenter: +((b.top + b.bottom) / 2).toFixed(2),
    seamDelta: +((b.top + b.bottom) / 2 - hb.bottom).toFixed(2),
    entry: eb ? { top: +eb.top.toFixed(2), h: +eb.height.toFixed(2) } : null,
    gapBarToEntry: eb ? +(eb.top - b.bottom).toFixed(2) : null,
  };
});
console.log(JSON.stringify(m, null, 2));
console.log('骑缝偏差', m.seamDelta, 'px（|Δ| ≤ 1 视为合格）');

// 首屏全页截图
await page.screenshot({ path: `${OUT}/member-bar-42-full.png` });
// 卡特写
const clip = await page.evaluate(() => {
  const b = document.getElementById('home-member-bar').getBoundingClientRect();
  return { x: Math.max(0, b.x - 8), y: Math.max(0, b.y - 8), width: b.width + 16, height: b.height + 16 };
});
await page.screenshot({ path: `${OUT}/member-bar-42-closeup.png`, clip });
await browser.close();
