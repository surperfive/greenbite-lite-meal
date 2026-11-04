/** 抽卡页「9折限时」徽章截图：整页 + 徽章局部放大 */
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
await page.waitForSelector('#badge-discount', { state: 'visible', timeout: 15000 });
await page.waitForTimeout(900);
// ⚠️ 徽章带 gb-badge-live 呼吸脉动（CSS scale），截图时相位不定会让像素测量抖动。
//    量几何/对齐前先摘掉这个 class 并等一帧。
await page.evaluate(() => {
  document.getElementById('badge-discount')?.classList.remove('gb-badge-live');
});
await page.waitForTimeout(400);
const clip = await page.evaluate(() => {
  const stage = document.getElementById('app-page-stage');
  const b = stage.parentElement.getBoundingClientRect();
  return { x: b.x, y: b.y, width: b.width, height: b.height };
});
await page.screenshot({ path: `${OUT}/gacha-page.png`, clip });
const bb = await page.evaluate(() => {
  const r = document.getElementById('badge-discount').getBoundingClientRect();
  return { x: r.x, y: r.y, width: r.width, height: r.height };
});
console.log('badge rect', bb);
await page.screenshot({
  path: `${OUT}/gacha-badge.png`,
  clip: { x: bb.x - 16, y: bb.y - 16, width: bb.width + 32, height: bb.height + 32 },
});
// 徽章内部元素坐标（SVG 用户坐标 → 屏幕）
const geo = await page.evaluate(() => {
  const svg = document.querySelector('#badge-discount').closest('svg');
  const out = {};
  for (const id of ['badge-bubble', 'badge-crown', 'txt-discount']) {
    const el = document.getElementById(id);
    if (!el) continue;
    const r = el.getBoundingClientRect();
    out[id] = { x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) };
  }
  out.svg = svg?.getBoundingClientRect().width;
  return out;
});
console.log(JSON.stringify(geo, null, 1));
await browser.close();
