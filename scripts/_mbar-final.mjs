/** 验证身份条已调到 42：量高度 + 两态 + 截图（含四宫格上下文） */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';
const OUT = 'scripts/_shots';
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });

const page = await browser.newPage({ viewport: { width: 410, height: 900 }, deviceScaleFactor: 4 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 25000 }).catch(()=>{});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 25000 }).catch(()=>{});
await page.waitForTimeout(400);
await page.click('#nav-tab-home');
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(()=>{});
await page.waitForTimeout(1600);

const r = await page.evaluate(() => {
  const bar = document.getElementById('home-member-bar');
  const cs = getComputedStyle(bar);
  const b = bar.getBoundingClientRect();
  const img = bar.querySelector('img');
  const badge = bar.querySelector('svg');
  const bar2 = bar.querySelector('span.relative');
  // 骑缝：hero 图底边 vs 卡中心
  const hero = document.querySelector('img[src*="hero-poster"]');
  const hb = hero?.getBoundingClientRect();
  return {
    barH: +b.height.toFixed(2),
    barTop: +b.top.toFixed(2),
    barCenter: +(b.top + b.height / 2).toFixed(2),
    heroBottom: hb ? +hb.bottom.toFixed(2) : null,
    seamDelta: hb ? +(b.top + b.height / 2 - hb.bottom).toFixed(2) : null,
    pt: cs.paddingTop, pb: cs.paddingBottom, radius: cs.borderRadius, minH: cs.minHeight,
    imgBox: img ? `${img.getBoundingClientRect().width.toFixed(1)}x${img.getBoundingClientRect().height.toFixed(1)}` : null,
    avatarBox: bar2 ? +bar2.getBoundingClientRect().height.toFixed(2) : null,
    badgeBox: badge ? `${badge.getBoundingClientRect().width.toFixed(1)}x${badge.getBoundingClientRect().height.toFixed(1)}` : null,
  };
});
console.log('已登录', JSON.stringify(r, null, 2));

const clip = await page.evaluate(() => {
  const b = document.getElementById('home-member-bar').getBoundingClientRect();
  return { x: Math.max(0,b.x-12), y: Math.max(0,b.y-26), width: Math.min(410-b.x+12,b.width+24), height: b.height+52 };
});
await page.screenshot({ path: `${OUT}/mbar-final.png`, clip });

// 上下文：hero 底 + 身份条 + 四宫格顶部
const clip2 = await page.evaluate(() => {
  const bar = document.getElementById('home-member-bar').getBoundingClientRect();
  return { x: 0, y: Math.max(0, bar.top - 90), width: 410, height: 240 };
});
await page.screenshot({ path: `${OUT}/mbar-final-ctx.png`, clip: clip2 });
await page.close();
await browser.close();
