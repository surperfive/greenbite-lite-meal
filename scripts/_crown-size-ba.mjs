/**
 * 皇冠 34px（改前）vs 44px（改后）：同一渲染环境，改前只回滚 DOM 尺寸，不动源码。
 */
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
await page.waitForTimeout(600);
await page.click('#nav-tab-gacha');
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 15000 }).catch(() => {});
await page.waitForSelector('#btn-header-tokens', { state: 'visible', timeout: 15000 });
await page.waitForTimeout(800);
await page.click('#btn-header-tokens');
await page.waitForTimeout(900);

const geo = await page.evaluate(() => {
  const h3 = [...document.querySelectorAll('h3')].find((e) => e.textContent?.includes('获取'));
  const row = h3.parentElement;
  const icon = row.querySelector('svg');
  const r = row.getBoundingClientRect();
  const b = icon.getBoundingClientRect();
  return {
    row: { x: r.x, y: r.y, w: r.width, h: r.height },
    icon: { x: b.x, y: b.y, w: b.width, h: b.height },
  };
});
const clip = {
  x: geo.row.x - 8,
  y: geo.row.y - 8,
  width: geo.row.w + 20,
  height: geo.row.h + 16,
};
console.log('icon', geo.icon);

await page.screenshot({ path: `${OUT}/crown-size-after.png`, clip });

// 改前：只把 SVG 的渲染尺寸写回 44px（行高由 h3 决定，行不会塌）
await page.evaluate(() => {
  const h3 = [...document.querySelectorAll('h3')].find((e) => e.textContent?.includes('获取'));
  const icon = h3.parentElement.querySelector('svg');
  icon.style.width = '44px';
  icon.style.height = '44px';
});
await page.waitForTimeout(250);
await page.screenshot({ path: `${OUT}/crown-size-before.png`, clip });
await browser.close();
console.log('done');
