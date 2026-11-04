import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { BASE } from './_base.mjs';

const OUT = 'probe-out/ingredient-art';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 3 });
const page = await ctx.newPage();
await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(700);
await page.evaluate(() => [...document.querySelectorAll('button')].find((x) => x.textContent?.trim() === '跳过')?.click());
await page.waitForTimeout(1200);
await page.click('#nav-tab-gacha');
await page.waitForTimeout(1500);

const pantry = page.locator('#unified-pantry-big-card');

// 初始食材库（3 款：多汁圣女果 / 羽衣甘蓝 / 安格斯牛排）
await pantry.scrollIntoViewIfNeeded();
await page.waitForTimeout(700);
await pantry.screenshot({ path: `${OUT}/pantry-3.png` });
console.log('pantry-3');

// 抽一次十连 → 食材库涨到 10 款
await page.click('#btn-gacha-ten');
await page.waitForTimeout(10000);
await page.keyboard.press('Escape');
await page.waitForTimeout(900);

await pantry.scrollIntoViewIfNeeded();
await page.waitForTimeout(700);
await pantry.screenshot({ path: `${OUT}/pantry-10.png` });
console.log('pantry-10');

await page.screenshot({ path: `${OUT}/gacha-full.png` });
console.log('gacha-full');

await browser.close();
