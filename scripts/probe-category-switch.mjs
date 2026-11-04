/**
 * 检查「分类切换」动画有没有被新增的 layout 属性破坏。
 * 原代码注释警告过：卡片在网格里横穿会造成瞬态重叠。
 * 这里冻结 rAF 抓切换中途的帧，直接看有没有卡片叠在一起。
 *
 * 用法：node scripts/probe-category-switch.mjs
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { BASE } from './_base.mjs';

const OUT = 'probe-out/category-switch';
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
await page.waitForTimeout(1500);

const freezeRaf = () =>
  page.evaluate(() => {
    window.requestAnimationFrame = () => 0;
  });

// 先抽一次十连，让食材库攒到 10 款，切换时位移才明显
await page.click('#btn-gacha-ten');
await page.waitForTimeout(5200);

// 抽卡币不足等弹窗会拦截点击，先关掉
await page.evaluate(() => {
  const close = [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === '关闭');
  close?.click();
});
await page.waitForTimeout(400);

// 点「蛋白」分类，在切换中途冻结
await page.locator('button', { hasText: '蛋白' }).first().click();
await page.waitForTimeout(90);
await freezeRaf();
await page.locator('#unified-pantry-big-card').screenshot({ path: `${OUT}/mid.png` });
console.log('captured mid.png');

await browser.close();
console.log(`\n输出目录：${OUT}`);
