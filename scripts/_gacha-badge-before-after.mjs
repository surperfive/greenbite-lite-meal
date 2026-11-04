/**
 * 「9折限时」徽章改前/改后对照图。
 * 改前那版不改源码 —— 直接在 DOM 上把三个属性回滚成旧值（655,41 / 674 / 54），
 * 这样对照图永远和当前源码的"新值"是同一套渲染环境，不会因为编译/缓存产生偏差。
 * 用法：BASE_URL=http://localhost:5180 node scripts/_gacha-badge-before-after.mjs
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';
const OUT = 'scripts/_shots';
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 6 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.waitForTimeout(600);
await page.click('#nav-tab-gacha');
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 15000 }).catch(() => {});
await page.waitForSelector('#badge-discount', { state: 'visible', timeout: 15000 });
await page.evaluate(() => document.getElementById('badge-discount')?.classList.remove('gb-badge-live'));
await page.waitForTimeout(500);

const clipOf = () => page.evaluate(() => {
  const r = document.getElementById('badge-discount').getBoundingClientRect();
  return { x: r.x - 10, y: r.y - 10, width: r.width + 20, height: r.height + 20 };
});

await page.screenshot({ path: `${OUT}/badge-after.png`, clip: await clipOf() });

// 回滚成 2026-10-25 之前的旧值
await page.evaluate(() => {
  document.getElementById('badge-crown').setAttribute('transform', 'translate(655,41) scale(0.66)');
  const t = document.getElementById('txt-discount');
  t.setAttribute('x', '674');
  t.setAttribute('y', '54');
});
await page.waitForTimeout(200);
await page.screenshot({ path: `${OUT}/badge-before.png`, clip: await clipOf() });
console.log('saved before/after');
await browser.close();
