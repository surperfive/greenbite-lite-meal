/**
 * 抽卡页食材卡片放大抓图：校验「价格 15px 比 kcal 13px 大」的观感，
 * 并确认卡片没被撑高 / 插画没被裁。
 * 用法：node scripts/shot-card-price.mjs
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { BASE } from './_base.mjs';

const OUT = 'outputs/card-price';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 3 });
await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
const page = await ctx.newPage();

await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#nav-tab-gacha', { timeout: 60000 });
await page.waitForTimeout(600);
await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((x) => x.textContent?.trim() === '跳过');
  b?.click();
});
await page.waitForTimeout(900);
await page.click('#nav-tab-gacha');
await page.waitForTimeout(1400);
await page.evaluate(() => { window.requestAnimationFrame = () => 0; });

// 食材库整卡区域
const box = await page.evaluate(() => {
  const card = document.querySelector('#unified-pantry-big-card');
  if (!card) return null;
  const r = card.getBoundingClientRect();
  return { x: r.x - 4, y: r.y - 4, width: r.width + 8, height: r.height + 8 };
});
if (box) {
  await page.screenshot({ path: `${OUT}/pantry-card.png`, clip: box });
  console.log('captured pantry-card', JSON.stringify(box));
}

// 再放大「180 kcal + ¥15」那张卡的底部一行
const rowBox = await page.evaluate(() => {
  const card = [...document.querySelectorAll('.grid > [class*="aspect-square"]')].find((c) =>
    c.textContent.includes('180 kcal')
  );
  if (!card) return null;
  const row = card.lastElementChild.getBoundingClientRect();
  const cr = card.getBoundingClientRect();
  return { x: cr.x - 3, y: row.y - 22, width: cr.width + 6, height: row.height + 30 };
});
if (rowBox) {
  await page.screenshot({ path: `${OUT}/row-zoom.png`, clip: rowBox });
  console.log('captured row-zoom', JSON.stringify(rowBox));
}

await browser.close();
