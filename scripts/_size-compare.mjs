/** 六道菜商品卡逐张截图，供拼图对比视觉大小（改构图参数后目视用） */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';
const OUT = 'scripts/_shots/sz';
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 3 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.waitForTimeout(900);
const n = await page.locator('[data-dish-thumb="true"]').count();
for (let i = 0; i < n; i++) {
  await page.evaluate((idx) => {
    document.querySelectorAll('[data-dish-thumb="true"]')[idx].scrollIntoView({ block: 'center' });
  }, i);
  await page.waitForTimeout(500);
  await page.evaluate(() => new Promise((r) => {
    let last = null, stable = 0;
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
    const card = el.closest('.group');
    const r = card.getBoundingClientRect();
    const thumb = el.getBoundingClientRect();
    const name = card.querySelector('h4')?.textContent?.trim() ?? '';
    return { x: r.x, y: r.y, w: r.width, h: r.height, tx: thumb.x, ty: thumb.y, tw: thumb.width, th: thumb.height, name };
  }, i);
  await page.screenshot({ path: `${OUT}/${i}.png`, clip: { x: box.x, y: box.y, width: box.w, height: box.h } });
  console.log(i, box.name, 'card', Math.round(box.w), Math.round(box.h), 'thumb', Math.round(box.tw), Math.round(box.th));
}
await browser.close();
