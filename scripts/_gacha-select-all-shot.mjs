/**
 * 「全选」胶囊三态截图：未选 / 部分选 / 全选。
 * 只截胶囊本身（4x），确认勾只在全选时出现。
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';
const OUT = 'scripts/_shots';
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 4 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.waitForTimeout(600);
await page.click('#nav-tab-gacha');
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 15000 }).catch(() => {});
await page.waitForSelector('#btn-category-select-all-pill', { state: 'visible', timeout: 15000 });
await page.waitForTimeout(900);

const clipOf = () => page.evaluate(() => {
  const el = document.getElementById('btn-category-select-all-pill');
  const r = el.getBoundingClientRect();
  return { x: r.x - 8, y: r.y - 8, width: r.width + 16, height: r.height + 16 };
});
const stateOf = () => page.evaluate(() => {
  const el = document.getElementById('btn-category-select-all-pill');
  const badge = el.querySelector('span.rounded-full.relative, span.relative.rounded-full');
  return {
    text: el.textContent?.trim(),
    hasCheck: !!el.querySelector('svg polyline'),
    badgeBg: badge ? getComputedStyle(badge).backgroundColor : null,
  };
});

// 1) 未选
console.log('未选:', JSON.stringify(await stateOf()));
await page.screenshot({ path: `${OUT}/select-all-none.png`, clip: await clipOf() });

// 2) 部分选：点食材网格前两个卡片
const clicked = await page.evaluate(() => {
  // ⚠️ 食材卡是 `motion.div`（不是 button），靠 `.cursor-pointer` 反查卡片根
  const badges = [...document.querySelectorAll('span.rounded-full')].filter(
    (s) => typeof s.className === 'string' && s.className.includes('w-3.5')
  );
  const cards = [...new Set(badges.map((s) => s.closest('.cursor-pointer')).filter(Boolean))];
  cards.slice(0, 2).forEach((c) => c.click());
  return cards.length;
});
await page.waitForTimeout(500);
console.log('已点食材卡:', clicked, '状态:', JSON.stringify(await stateOf()));
await page.screenshot({ path: `${OUT}/select-all-partial.png`, clip: await clipOf() });

// 3) 全选
await page.click('#btn-category-select-all-pill');
await page.waitForTimeout(600);
console.log('全选后:', JSON.stringify(await stateOf()));
await page.screenshot({ path: `${OUT}/select-all-full.png`, clip: await clipOf() });

// 4) 再点一次取消全选
await page.click('#btn-category-select-all-pill');
await page.waitForTimeout(600);
console.log('取消全选后:', JSON.stringify(await stateOf()));
await browser.close();
