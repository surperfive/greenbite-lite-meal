/**
 * 餐盖光圈抓图：静止态 + 掀盖过程（光晕最强的那一段）。
 * 用法：node scripts/shot-cloche-halo.mjs [输出子目录]
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { BASE } from './_base.mjs';

const OUT = `outputs/${process.argv[2] ?? 'cloche-halo'}`;
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 420, height: 844 }, deviceScaleFactor: 3 });
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
await page.waitForTimeout(1800);

// 只截餐盖区域，方便比对光圈
const domeBox = async () => {
  const el = await page.$('#cloche-and-plate-group');
  const r = await el.boundingBox();
  const pad = 70;
  return {
    x: Math.max(0, r.x - pad),
    y: Math.max(0, r.y - pad),
    width: Math.min(420, r.width + pad * 2),
    height: Math.min(844, r.height + pad * 2),
  };
};

await page.screenshot({ path: `${OUT}/0-idle.png`, timeout: 60000 });
await page.screenshot({ path: `${OUT}/0-idle-dome.png`, clip: await domeBox(), timeout: 60000 });
console.log('captured idle');

await page.locator('#btn-gacha-single').click();
for (const t of [300, 550, 800, 1100, 1500]) {
  await page.waitForTimeout(t === 300 ? 300 : 250);
  await page.screenshot({ path: `${OUT}/${t}-draw-dome.png`, clip: await domeBox(), timeout: 60000 });
  console.log('captured draw', t);
}

await browser.close();
console.log(`\n输出目录：${OUT}`);
