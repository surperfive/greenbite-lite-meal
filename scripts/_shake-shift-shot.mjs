/**
 * 奶昔右移 3 的改前/改后对照（4x 局部）。
 * 改前那版不改源码 —— 直接在 DOM 上把 img 的 translateX 从 1.6% 改回 -1.4%，
 * 保证两版同一渲染环境。
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
await page.waitForTimeout(800);

// 定位奶昔卡（index 2）
await page.evaluate(() => {
  document.querySelectorAll('[data-dish-thumb="true"]')[2].scrollIntoView({ block: 'center' });
});
await page.waitForTimeout(600);
await page.evaluate(() => new Promise((r) => {
  let last = null, stable = 0;
  const tick = () => { const y = window.scrollY; stable = y === last ? stable + 1 : 0; last = y;
    if (stable >= 3) r(); else requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
}));

const clipOf = () => page.evaluate(() => {
  const el = document.querySelectorAll('[data-dish-thumb="true"]')[2];
  const r = el.getBoundingClientRect();
  return { x: r.x - 6, y: r.y - 6, width: r.width + 12, height: r.height + 12 };
});

const setX = (px) => page.evaluate((v) => {
  const el = document.querySelectorAll('[data-dish-thumb="true"]')[2];
  const img = el.querySelector('img');
  const t = img.style.transform;
  img.style.transform = t.replace(/translate\(([-\d.]+)%/, `translate(${v}%`);
}, px);

await page.screenshot({ path: `${OUT}/shake-after.png`, clip: await clipOf() });
await setX(-1.4);
await page.waitForTimeout(200);
await page.screenshot({ path: `${OUT}/shake-before.png`, clip: await clipOf() });
console.log('ok');
await browser.close();
