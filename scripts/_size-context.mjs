/** 截某道菜所在那一屏，看构图在列表上下文里是否协调。用法：node _size-context.mjs [index] */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';
const IDX = Number(process.argv[2] ?? 3);
const OUT = 'scripts/_shots';
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.waitForTimeout(900);
await page.evaluate((i) => {
  document.querySelectorAll('[data-dish-thumb="true"]')[i].scrollIntoView({ block: 'center' });
}, IDX);
await page.waitForTimeout(600);
await page.evaluate(() => new Promise((r) => {
  let last = null, stable = 0;
  const tick = () => { const y = window.scrollY; stable = y === last ? stable + 1 : 0; last = y;
    if (stable >= 3) r(); else requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
}));
const clip = await page.evaluate(() => {
  const stage = document.getElementById('app-page-stage');
  const b = stage.parentElement.getBoundingClientRect();
  return { x: b.x, y: b.y, width: b.width, height: b.height };
});
await page.screenshot({ path: `${OUT}/size-context-${IDX}.png`, clip });
console.log('ok');
await browser.close();
