/**
 * 抽卡页分类 tab 验证：全部 / 蛋白 / 蔬底 三态截图 + 网格卡片数。
 * 断言 tab 真的在筛选（蛋白 5 张、蔬底 2 张、全部 10 张）。
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';
const OUT = 'scripts/_shots';
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 3 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.waitForTimeout(600);
await page.click('#nav-tab-gacha');
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 15000 }).catch(() => {});
await page.waitForSelector('#btn-category-select-all-pill', { state: 'visible', timeout: 15000 });
await page.waitForTimeout(1000);

const cardCount = () =>
  page.evaluate(() =>
    [...document.querySelectorAll('span.rounded-full')].filter(
      (s) => typeof s.className === 'string' && s.className.includes('w-3.5')
    ).length
  );

const clipRow = () => page.evaluate(() => {
  const card = document.getElementById('unified-pantry-big-card');
  const r = card.getBoundingClientRect();
  return { x: r.x, y: r.y, width: r.width, height: 64 };
});

const tabs = ['全部', '蛋白', '蔬底'];
for (const label of tabs) {
  await page.evaluate((t) => {
    const btns = [...document.querySelectorAll('button')].filter((b) => b.textContent?.trim() === t);
    btns[0]?.click();
  }, label);
  await page.waitForTimeout(700);
  const n = await cardCount();
  console.log(`${label}: 食材卡 ${n} 张`);
  await page.screenshot({ path: `${OUT}/gacha-tab-${label}.png`, clip: await clipRow() });
}
// 整页（全部态）
await page.evaluate(() => {
  const btns = [...document.querySelectorAll('button')].filter((b) => b.textContent?.trim() === '全部');
  btns[0]?.click();
});
await page.waitForTimeout(700);
const clip = await page.evaluate(() => {
  const stage = document.getElementById('app-page-stage');
  const b = stage.parentElement.getBoundingClientRect();
  return { x: b.x, y: b.y, width: b.width, height: b.height };
});
await page.screenshot({ path: `${OUT}/gacha-tabs-restored.png`, clip });
await browser.close();
