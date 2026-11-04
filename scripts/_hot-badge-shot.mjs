/** 首页人气卡 HOT 角标 + 搜索结果 TOP 角标 特写（检查玫红与黑字对比）。 */
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
await page.click('#nav-tab-home');
await page.waitForTimeout(1600);
// 滚到人气区
await page.evaluate(() => {
  const el = document.getElementById('home-popular-dishes-section');
  el?.scrollIntoView({ block: 'center' });
});
await page.waitForTimeout(700);
const box = await page.evaluate(() => {
  const el = document.getElementById('home-popular-dishes-section');
  const b = el.getBoundingClientRect();
  return { x: b.x, y: Math.max(0, b.y), width: b.width, height: Math.min(b.height, 320) };
});
await page.screenshot({ path: `${OUT}/hot-badge.png`, clip: box });
const info = await page.evaluate(() => {
  const spans = [...document.querySelectorAll('#home-popular-dishes-section span')]
    .filter((s) => s.textContent.trim() === 'HOT');
  return spans.slice(0, 2).map((s) => {
    const cs = getComputedStyle(s);
    const b = s.getBoundingClientRect();
    return { bg: cs.backgroundColor, color: cs.color, w: +b.width.toFixed(1), h: +b.height.toFixed(1) };
  });
});
console.log(JSON.stringify(info));
await browser.close();
