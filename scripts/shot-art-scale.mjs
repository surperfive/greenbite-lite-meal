/**
 * 食材插画尺寸对比：用 addStyleTag 覆写 img 尺寸，不改源码，一次出 4 档。
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { BASE } from './_base.mjs';

const OUT = 'probe-out/art-scale';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 3 });
const page = await ctx.newPage();
// 改源码后 Vite 会冷编译，首次请求要等编译完成，默认 30s 不够
await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 90000 });
await page.waitForTimeout(700);
await page.evaluate(() => [...document.querySelectorAll('button')].find((x) => x.textContent?.trim() === '跳过')?.click());
await page.waitForTimeout(1200);
await page.click('#nav-tab-gacha');
await page.waitForTimeout(1500);

const pantry = page.locator('#unified-pantry-big-card');
await pantry.scrollIntoViewIfNeeded();
await page.waitForTimeout(700);

// 当前实现：76px
await pantry.screenshot({ path: `${OUT}/s76.png` });
console.log('s76（当前）');

for (const px of [64, 56, 48]) {
  await page.addStyleTag({
    content: `#unified-pantry-big-card img{width:${px}px !important;height:${px}px !important;max-width:none !important}`
  });
  await page.waitForTimeout(350);
  await pantry.screenshot({ path: `${OUT}/s${px}.png` });
  console.log(`s${px}`);
}

await browser.close();
