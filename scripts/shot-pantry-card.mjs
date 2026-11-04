/**
 * 单独截取抽卡页「食材库大卡片」（#unified-pantry-big-card），用于校验描边样式。
 * 用法：node scripts/shot-pantry-card.mjs
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { BASE } from './_base.mjs';

const OUT = 'probe-out/pantry';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({
  viewport: { width: 420, height: 900 },
  deviceScaleFactor: 3
});
const page = await ctx.newPage();

await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(600);
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === '跳过');
  btn?.click();
});
await page.waitForTimeout(900);

await page.click('#nav-tab-gacha');
await page.waitForTimeout(1400);

const card = page.locator('#unified-pantry-big-card');
await card.scrollIntoViewIfNeeded();
await page.waitForTimeout(500);
await card.screenshot({ path: `${OUT}/card.png` });
console.log('captured card.png');

// 再抓一张带青柠背景的上下文，用来判断去掉黑边后卡片是否还立得住
await page.screenshot({ path: `${OUT}/context.png` });
console.log('captured context.png');

await browser.close();
console.log(`\n输出目录：${OUT}`);
