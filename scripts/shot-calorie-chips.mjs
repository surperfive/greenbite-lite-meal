/**
 * 截取点餐页「热量筛选」胶囊行，用于校验火焰图标描边色。
 * 用法：node scripts/shot-calorie-chips.mjs
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { BASE } from './_base.mjs';

const OUT = 'probe-out/calorie-chips';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({
  viewport: { width: 420, height: 900 },
  deviceScaleFactor: 4
});
const page = await ctx.newPage();

await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(600);
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === '跳过');
  btn?.click();
});
await page.waitForTimeout(900);

await page.click('#nav-tab-menu');
await page.waitForTimeout(1200);

// 定位含「大卡」的筛选胶囊，用它的外接矩形裁切
const chip = page.locator('button', { hasText: '≤250大卡' }).first();
const box = await chip.boundingBox();
if (!box) throw new Error('未找到热量筛选胶囊');

await page.screenshot({
  path: `${OUT}/row.png`,
  clip: {
    x: 0,
    y: Math.max(0, box.y - 10),
    width: 420,
    height: box.height + 20
  }
});
console.log('captured row.png');

// 再单独放大「≤250大卡」这一颗
await page.screenshot({
  path: `${OUT}/single.png`,
  clip: { x: Math.max(0, box.x - 6), y: box.y - 6, width: box.width + 12, height: box.height + 12 }
});
console.log('captured single.png');

await browser.close();
console.log(`\n输出目录：${OUT}`);
