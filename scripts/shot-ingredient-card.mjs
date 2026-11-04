/**
 * 抽卡页食材卡「选中态」截图，用于校验描边样式。
 * 选中若干张卡后截图，重点看外层青柠环与内层是否还有黑边。
 *
 * 用法：node scripts/shot-ingredient-card.mjs
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { BASE } from './_base.mjs';

const OUT = 'probe-out/ingredient-card';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({
  viewport: { width: 420, height: 900 },
  deviceScaleFactor: 3
});
const page = await ctx.newPage();

await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(600);
// 跳过加载屏
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === '跳过');
  btn?.click();
});
await page.waitForTimeout(900);

// 进抽卡页
await page.click('#nav-tab-gacha');
await page.waitForTimeout(1200);

// 选中 3 张食材卡（食材库网格：.grid 下带 aspect-square 的直接子节点）
const cards = page.locator('.grid > [class*="aspect-square"]');
const n = await cards.count();
console.log('食材卡数量:', n);
for (const i of [0, 1, 3]) {
  if (i < n) await cards.nth(i).click();
}
await page.waitForTimeout(800);

await page.screenshot({ path: `${OUT}/selected.png` });
console.log('captured selected');

// 再裁一张近景，方便看描边细节
const box = await cards.nth(0).boundingBox();
if (box) {
  await page.screenshot({
    path: `${OUT}/closeup.png`,
    clip: {
      x: Math.max(0, box.x - 14),
      y: Math.max(0, box.y - 14),
      width: Math.min(box.width * 2 + 28, 420),
      height: box.height + 28
    }
  });
  console.log('captured closeup');
}

await browser.close();
console.log(`\n输出目录：${OUT}`);
