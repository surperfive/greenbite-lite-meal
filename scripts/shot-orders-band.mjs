/**
 * 订单页卡片顶部色带：确认已从渐变改为纯绿，并检查「色带下沿的硬边」落在哪一行。
 * 用法：node scripts/shot-orders-band.mjs
 *
 * 输出：outputs/orders-band/*.png + 控制台打印色带像素行剖面（y=0 → 60 的取值），
 *      剖面里应看到 44px 内是同一个绿值、之后突变纯白（硬边），没有中间过渡色。
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { BASE } from './_base.mjs';

const OUT = 'outputs/orders-band';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 3 });
const page = await ctx.newPage();

await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(600);
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === '跳过');
  btn?.click();
});
await page.waitForTimeout(1200);
await page.click('#nav-tab-orders');
await page.waitForTimeout(1200);

const cards = page.locator('.rounded-\\[20px\\]');
const n = await cards.count();
console.log('订单卡数量:', n);

for (let i = 0; i < Math.min(n, 3); i++) {
  await cards.nth(i).scrollIntoViewIfNeeded();
  await page.waitForTimeout(120);
  await cards.nth(i).screenshot({ path: `${OUT}/card-${i + 1}.png` });
}

// 整页一张，看两卡片的色带节奏
await page.screenshot({ path: `${OUT}/page.png` });

const card = cards.first();
const box = await card.boundingBox();
await card.screenshot({ path: `${OUT}/_probe.png` });

await ctx.close();
await browser.close();

console.log(`卡片 box: x=${box.x.toFixed(1)} y=${box.y.toFixed(1)} w=${box.width.toFixed(1)} h=${box.height.toFixed(1)}`);
console.log(`\n截图 → ${OUT}`);
