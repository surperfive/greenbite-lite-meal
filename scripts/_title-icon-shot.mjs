/**
 * 标题 + 右侧皇冠：4× 局部，并量两者的墨迹中心（判断图标是否比标题偏高/偏低）
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
  const a = h3.getBoundingClientRect();
  const b = icon.getBoundingClientRect();
  return {
    h3: { x: a.x, y: a.y, w: a.width, h: a.height, cy: a.y + a.height / 2 },
    icon: { x: b.x, y: b.y, w: b.width, h: b.height, cy: b.y + b.height / 2 },
    row: (() => { const r = row.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; })(),
    iconClass: icon.getAttribute('class'),
    path: icon.querySelector('path')?.getAttribute('stroke-width'),
  };
});
console.log(JSON.stringify(geo, null, 2));
const pad = 8;
await page.screenshot({
  path: `${OUT}/title-icon.png`,
  clip: { x: geo.row.x - pad, y: geo.row.y - pad - 4, width: geo.row.w + pad * 2, height: geo.row.h + pad * 2 + 8 },
});
await browser.close();
