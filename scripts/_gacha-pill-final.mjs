/** 三态循环切换验证：滑块位置、尺寸、文字颜色是否都跟着走。 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';
fs.mkdirSync('scripts/_shots', { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#nav-tab-gacha', { timeout: 20000 });
await page.waitForTimeout(600);
await page.click('#nav-tab-gacha');
await page.waitForSelector('#unified-pantry-big-card', { timeout: 15000 });
await page.waitForTimeout(1200);

const track = page.locator('#unified-pantry-big-card div.relative.inline-flex').first();
const tb = await track.boundingBox();
const clip = { x: Math.max(0, tb.x - 8), y: Math.max(0, tb.y - 8), width: tb.width + 16, height: tb.height + 16 };

const state = () => page.evaluate(() => {
  const el = document.querySelector('#unified-pantry-big-card div.relative.inline-flex');
  const btns = [...el.querySelectorAll('button')];
  const slider = el.querySelector('span.pointer-events-none.absolute');
  const er = el.getBoundingClientRect();
  const sr = slider?.getBoundingClientRect();
  return {
    slider: sr ? { x: +(sr.left - er.left).toFixed(1), w: +sr.width.toFixed(1), h: +sr.height.toFixed(1) } : null,
    labels: btns.map((b) => {
      const l = b.querySelector('.pill-label');
      const cs = getComputedStyle(l);
      return `${l.textContent.trim()}:${cs.color}`;
    }),
  };
});

for (const label of ['蛋白', '蔬底', '全部']) {
  await page.locator('#unified-pantry-big-card button').filter({ hasText: label }).first().click();
  await page.waitForTimeout(700);
  const s = await state();
  const idx = { 全部: 0, 蛋白: 1, 蔬底: 2 }[label];
  console.log(`点击「${label}」→ 滑块 x=${s.slider.x} w=${s.slider.w} h=${s.slider.h}（按钮 ${5 + idx * 66}）`, s.labels.join('  '));
  await page.screenshot({ path: `scripts/_shots/pill-state-${label}.png`, clip });
}
console.log('errors:', errs.length ? errs : 'none');
await browser.close();
