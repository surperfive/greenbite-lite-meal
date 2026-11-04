/** 会员皇冠徽章：8× 局部 + 像素级量「圆 vs 皇冠」的四边留白 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';
const OUT = 'scripts/_shots';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 8 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.waitForTimeout(600);
await page.click('#nav-tab-home');
await page.waitForSelector('#home-member-bar', { timeout: 15000 });
await page.waitForTimeout(1600);

const geo = await page.evaluate(() => {
  const bar = document.getElementById('home-member-bar');
  const img = bar.querySelector('img');
  const badge = img.parentElement.parentElement.querySelector('svg');
  const svg = badge;
  const pick = (el) => {
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return { x: +b.x.toFixed(3), y: +b.y.toFixed(3), w: +b.width.toFixed(3), h: +b.height.toFixed(3) };
  };
  return { img: pick(img), badge: pick(badge), svg: pick(svg) };
});
console.log(JSON.stringify(geo, null, 2));

// 8× 裁徽章（带 3px 余量）
const clip = await page.evaluate(() => {
  const bar = document.getElementById('home-member-bar');
  const img = bar.querySelector('img');
  const badge = img.parentElement.parentElement.querySelector('svg');
  const b = badge.getBoundingClientRect();
  return { x: b.x - 3, y: b.y - 3, width: b.width + 6, height: b.height + 6 };
});
await page.screenshot({ path: `${OUT}/crown-badge-8x.png`, clip });
console.log('ok');
await browser.close();
