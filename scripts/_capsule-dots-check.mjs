import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#nav-tab-home', { timeout: 20000 });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(2400);
const info = await page.evaluate(() => {
  const btn = document.querySelector('[aria-label="切换到第 1 张轮播图"]');
  if (!btn) return { found: false };
  const box = btn.parentElement.getBoundingClientRect();
  const cs = getComputedStyle(btn.parentElement);
  const r = btn.getBoundingClientRect();
  // 谁在中心点最上层
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const top = document.elementFromPoint(cx, cy);
  return {
    found: true,
    box: `x${box.left.toFixed(1)}~${box.right.toFixed(1)} y${box.top.toFixed(1)}~${box.bottom.toFixed(1)} ${box.width.toFixed(1)}×${box.height.toFixed(1)}`,
    bg: cs.backgroundColor, z: cs.zIndex, opacity: cs.opacity, overflow: cs.overflow,
    topEl: top ? top.tagName + '.' + (top.className?.toString?.().slice(0, 40) || '') : 'null',
  };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
