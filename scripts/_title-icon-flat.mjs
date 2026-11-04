/**
 * 去掉**所有**旋转（行 -2° + 卡片 -1.6°）后量「标题墨迹中心 vs 皇冠墨迹中心」的真实垂直差。
 * ⚠️ Tailwind v4 的 `-rotate-2` 写在 `rotate` 属性上，只清 `transform` 去不掉。
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

await page.evaluate(() => {
  document.querySelectorAll('*').forEach((el) => {
    el.style.rotate = 'none';
    el.style.transform = 'none';
  });
});
await page.waitForTimeout(300);

const geo = await page.evaluate(() => {
  const h3 = [...document.querySelectorAll('h3')].find((e) => e.textContent?.includes('获取'));
  const row = h3.parentElement;
  const icon = row.querySelector('svg');
  const a = h3.getBoundingClientRect();
  const b = icon.getBoundingClientRect();
  return {
    h3: { x: +a.x.toFixed(2), y: +a.y.toFixed(2), w: +a.width.toFixed(2), h: +a.height.toFixed(2) },
    icon: { x: +b.x.toFixed(2), y: +b.y.toFixed(2), w: +b.width.toFixed(2), h: +b.height.toFixed(2) },
    row: (() => { const r = row.getBoundingClientRect(); return { x: +r.x.toFixed(2), y: +r.y.toFixed(2), w: +r.width.toFixed(2), h: +r.height.toFixed(2) }; })(),
  };
});
console.log(JSON.stringify(geo, null, 2));
await page.screenshot({
  path: `${OUT}/title-icon-flat.png`,
  clip: { x: geo.row.x - 8, y: geo.row.y - 8, width: geo.row.w + 16, height: geo.row.h + 16 },
});
await browser.close();
