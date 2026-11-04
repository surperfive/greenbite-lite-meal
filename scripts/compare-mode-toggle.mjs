/**
 * 对比「外卖/自提」切换选中态的两种绿黑方向。
 * 用 addStyleTag 在页面内覆写，不改源码。
 * 用法：node scripts/compare-mode-toggle.mjs
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { BASE } from './_base.mjs';

const OUT = 'outputs/mode-toggle';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 4 });
const page = await ctx.newPage();

await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(600);
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === '跳过');
  btn?.click();
});
await page.waitForTimeout(1200);
await page.click('#nav-tab-menu');
await page.waitForTimeout(1200);

const box = await page.locator('button', { hasText: '外卖' }).first().boundingBox();
const clip = { x: 0, y: Math.max(0, box.y - 12), width: 260, height: box.height + 24 };

// A：当前实现 —— 青柠底 + 黑字
await page.screenshot({ path: `${OUT}/a-lime-black.png`, clip });
console.log('captured a-lime-black');

// B：黑底 + 青柠字（对齐 HeaderBar 里订单/收藏页的同类切换）
const style = await page.addStyleTag({
  content: `
    .mode-toggle-probe-indicator { background: #111827 !important; }
    .mode-toggle-probe-on { color: #C7F665 !important; }
  `
});
await page.evaluate(() => {
  const track = [...document.querySelectorAll('div')].find(
    (d) => d.className?.includes?.('h-[34px]') && d.className?.includes?.('rounded-full')
  );
  if (!track) return;
  track.children[0]?.classList.add('mode-toggle-probe-indicator');
  [...track.querySelectorAll('button')].forEach((b) => {
    if (b.className.includes('text-black')) b.classList.add('mode-toggle-probe-on');
  });
});
await page.waitForTimeout(200);
await page.screenshot({ path: `${OUT}/b-black-lime.png`, clip });
console.log('captured b-black-lime');
await style.evaluate((el) => el.remove());

await ctx.close();
await browser.close();
console.log(`\n输出目录：${OUT}`);
