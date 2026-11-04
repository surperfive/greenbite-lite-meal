/** 量化进出场动画：记录页面 left 偏移随时间变化（确认是从右滑入/滑出，不是瞬变） */
import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 1 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.waitForTimeout(700);

const sample = async (label, ms) => {
  const out = await page.evaluate(async (duration) => {
    const t0 = performance.now();
    const frames = [];
    while (performance.now() - t0 < duration) {
      const el = document.querySelector('[data-store-page="true"]');
      frames.push({ t: Math.round(performance.now() - t0), x: el ? Math.round(el.getBoundingClientRect().x) : null });
      await new Promise((r) => requestAnimationFrame(r));
    }
    return frames;
  }, ms);
  console.log(label, JSON.stringify(out.filter((_, i) => i % 3 === 0)));
};

await page.click('[title="点击切换门店"]');
await sample('入场 x 序列:', 420);
await page.waitForTimeout(200);
await page.click('[data-store-page="true"] button[aria-label="返回"]');
await sample('出场 x 序列:', 420);
await browser.close();
