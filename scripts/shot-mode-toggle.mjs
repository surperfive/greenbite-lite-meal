/** 截取「自提」选中态，确认滑块位移正常。用法：node scripts/shot-mode-toggle.mjs */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { BASE } from './_base.mjs';

const OUT = 'outputs/mode-toggle';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 4 });
const page = await ctx.newPage();

await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(600);
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === '跳过');
  btn?.click();
});
await page.waitForTimeout(1200);
await page.click('#nav-tab-menu');
await page.waitForTimeout(1200);

const anchor = page.locator('button', { hasText: '外卖' }).first();
const clip = async () => {
  const box = await anchor.boundingBox();
  return { x: 0, y: Math.max(0, box.y - 12), width: 260, height: box.height + 24 };
};

await page.locator('button', { hasText: '自提' }).first().click();
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/c-pickup.png`, clip: await clip() });
console.log('captured c-pickup');

await ctx.close();
await browser.close();
console.log(`\n输出目录：${OUT}`);
