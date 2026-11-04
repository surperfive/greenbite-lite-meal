/** 身份条头像 + 皇冠徽章 4× 特写（检查 12px 徽章的皇冠是否还读得出来、有无裁切） */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';
const OUT = 'scripts/_shots';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 4 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.click('#nav-tab-home');
await page.waitForTimeout(1600);

const clip = await page.evaluate(() => {
  const bar = document.getElementById('home-member-bar');
  const av = bar.querySelector('span.relative.shrink-0');
  const b = av.getBoundingClientRect();
  return { x: b.x - 4, y: b.y - 4, width: b.width + 8, height: b.height + 8 };
});
await page.screenshot({ path: `${OUT}/member-bar-avatar-4x.png`, clip });
const info = await page.evaluate(() => {
  const bar = document.getElementById('home-member-bar');
  const av = bar.querySelector('span.relative.shrink-0').getBoundingClientRect();
  const badge = bar.querySelector('svg[viewBox="0 0 28 28"]').getBoundingClientRect();
  return {
    avatar: { w: +av.width.toFixed(2), h: +av.height.toFixed(2) },
    badge: { w: +badge.width.toFixed(2), h: +badge.height.toFixed(2) },
    badgeOverflowRight: +(badge.right - av.right).toFixed(2),
    badgeOverflowBottom: +(badge.bottom - av.bottom).toFixed(2),
  };
});
console.log(JSON.stringify(info));
await browser.close();
