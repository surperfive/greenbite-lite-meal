/**
 * 压缩后画质目检：截首页 / 我的 / 点餐 三页，重点看压缩幅度最大的几处。
 *
 * 用法：node scripts/_quality-shots.mjs [输出目录]
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { BASE } from './_base.mjs';

const OUT = process.argv[2] ?? 'scripts/_shots/quality';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({
  viewport: { width: 430, height: 900 },
  deviceScaleFactor: 2,
});

await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 30000 });
await page.waitForFunction(
  () => {
    const el = document.querySelector('#app-page-stage');
    return el && getComputedStyle(el).opacity === '1';
  },
  { timeout: 30000 }
);

// 冻结轮播，避免截图时跳到下一张
await page.evaluate(() => {
  let id = setInterval(() => {}, 1000);
  for (let i = 0; i <= id; i++) clearInterval(i);
});

async function shot(name, tabId) {
  if (tabId) {
    await page.click(`#${tabId}`);
    await page.waitForTimeout(800);
    await page.waitForFunction(
      () => {
        const el = document.querySelector('#app-page-stage');
        return el && getComputedStyle(el).opacity === '1';
      },
      { timeout: 15000 }
    );
  }
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log(`  ${OUT}/${name}.png`);
}

await shot('01-home', 'nav-tab-home');
await shot('02-me', 'nav-tab-me');
await shot('03-menu', 'nav-tab-menu');
await shot('04-gacha', 'nav-tab-gacha');

// invite-banner 局部放大：它是唯一「大图 + 文字 + 带 alpha」的重压缩对象
await page.click('#nav-tab-me');
await page.waitForTimeout(900);
const banner = page.locator('img[src="/invite-banner.png"]');
if (await banner.count()) {
  await banner.first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await banner.first().screenshot({ path: `${OUT}/05-invite-banner.png` });
  console.log(`  ${OUT}/05-invite-banner.png`);
}

// 食材图（320→128，压缩比 70%）
await page.click('#nav-tab-gacha');
await page.waitForTimeout(900);
const ing = page.locator('img[src*="/ingredients/"]').first();
if (await ing.count()) {
  await ing.first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await ing.first().screenshot({ path: `${OUT}/06-ingredient.png` });
  console.log(`  ${OUT}/06-ingredient.png`);
}

await browser.close();
console.log('完成');
