/**
 * blob 底盘验证 v2：用 clip 截图（元素级 screenshot 在 chrome channel 下对
 * 透明容器会出空白，改为取 boundingClientRect + page.screenshot clip）。
 * 用法：BASE_URL=http://localhost:5180 node scripts/_blob-shot2.mjs
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';

const OUT = 'scripts/_shots';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 3 });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));

await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.waitForTimeout(900);

const n = await page.locator('[data-dish-thumb="true"]').count();
console.log('dish thumbs:', n);

for (let i = 0; i < n; i++) {
  await page.evaluate((idx) => {
    const el = document.querySelectorAll('[data-dish-thumb="true"]')[idx];
    el.scrollIntoView({ block: 'center' });
  }, i);
  await page.waitForTimeout(700);
  // 等滚动真正静止（连续两帧位置一致），避免截到重排中途
  await page.evaluate(() => new Promise((r) => {
    let last = null;
    let stable = 0;
    const tick = () => {
      const y = window.scrollY;
      stable = y === last ? stable + 1 : 0;
      last = y;
      if (stable >= 3) r(); else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }));
  const box = await page.evaluate((idx) => {
    const el = document.querySelectorAll('[data-dish-thumb="true"]')[idx];
    const r = el.getBoundingClientRect();
    const name = el.closest('.group')?.querySelector('h4')?.textContent ?? '';
    return { x: r.x, y: r.y, w: r.width, h: r.height, name };
  }, i);
  await page.screenshot({
    path: `${OUT}/blob2-${i}-${box.name}.png`,
    clip: { x: box.x, y: box.y, width: box.w, height: box.h },
  });
  console.log(i, box.name, box.w, box.h);
}

await browser.close();
