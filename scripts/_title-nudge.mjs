/**
 * 皇冠垂直位置候选：0 / 6 / 10px 下移（DOM 改 style.translate，不改源码）
 * 参考：标题墨迹中心比图标中心低 10.4px
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

const clip = await page.evaluate(() => {
  const h3 = [...document.querySelectorAll('h3')].find((e) => e.textContent?.includes('获取'));
  const row = h3.parentElement;
  const r = row.getBoundingClientRect();
  return { x: r.x - 8, y: r.y - 10, width: r.width + 16, height: r.height + 20 };
});
for (const dy of [0, 6, 10]) {
  await page.evaluate((d) => {
    const h3 = [...document.querySelectorAll('h3')].find((e) => e.textContent?.includes('获取'));
    h3.parentElement.querySelector('svg').style.translate = `0 ${d}px`;
  }, dy);
  await page.waitForTimeout(180);
  await page.screenshot({ path: `${OUT}/title-nudge-${dy}.png`, clip });
}
await browser.close();
