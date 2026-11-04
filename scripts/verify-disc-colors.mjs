/**
 * 验证「每道菜的椭圆盘色 = 该菜代表色」。
 * 用法：node scripts/verify-disc-colors.mjs
 *
 * 输出：
 *   - 控制台打印「菜名 → 盘色（computed rgb）+ 期望色」对照表
 *   - outputs/disc-colors/card-*.png 每张卡片单独截图，方便拼长图
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { BASE } from './_base.mjs';

const OUT = 'outputs/disc-colors';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 420, height: 1500 }, deviceScaleFactor: 3 });
const page = await ctx.newPage();

await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(600);
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === '跳过');
  btn?.click();
});
await page.waitForTimeout(1200);
await page.click('#nav-tab-menu');
await page.waitForTimeout(1400);

const info = await page.evaluate(() => {
  const hex = (rgb) => {
    const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!m) return rgb;
    return '#' + [1, 2, 3].map((i) => Number(m[i]).toString(16).padStart(2, '0')).join('').toUpperCase();
  };
  return [...document.querySelectorAll('[data-dish-thumb="true"]')].map((thumb) => {
    // thumb > DishCoverArt 根 div > 盘 div（圆角 50%）
    const disc = thumb.querySelector(':scope > div > div');
    const card = thumb.parentElement;
    const cs = disc ? getComputedStyle(disc) : null;
    const rect = disc?.getBoundingClientRect();
    return {
      name: card?.querySelector('h4')?.textContent?.trim() ?? '?',
      discHex: cs ? hex(cs.backgroundColor) : null,
      discAlpha: cs?.opacity ?? null,
      disc: rect ? { w: +rect.width.toFixed(1), h: +rect.height.toFixed(1) } : null,
      // 弧文字颜色：确认黑字在这块盘上仍然可读
      arcInk: thumb.querySelector('svg text')?.getAttribute('fill') ?? null,
    };
  });
});

console.table(info);

const expected = { 1: '#9FD456', 3: '#8ADFA8', 4: '#FAD984', 7: '#FBAE68', 8: '#C9A375', 9: '#FBA6C3' };
const soften = (hex, w = 0.1) => {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c) => Math.round(c + (255 - c) * w).toString(16).padStart(2, '0');
  return ('#' + mix((n >> 16) & 255) + mix((n >> 8) & 255) + mix(n & 255)).toUpperCase();
};
console.log('\n期望盘色（dish.bg 混白 10%）：');
for (const [id, bg] of Object.entries(expected)) console.log(`  #${id}  ${bg} → ${soften(bg)}`);

const thumbs = page.locator('[data-dish-thumb="true"]');
const n = await thumbs.count();
for (let i = 0; i < n; i++) {
  const card = thumbs.nth(i).locator('xpath=..');
  await card.scrollIntoViewIfNeeded();
  await page.waitForTimeout(150);
  await card.screenshot({ path: `${OUT}/card-${i + 1}.png` });
}
// 整列表一张：视口足够高，六道菜同屏，方便一眼比对色块节奏
await page.evaluate(() => {
  const scroller = document.querySelector('[data-dish-thumb="true"]')?.closest('.overflow-y-auto');
  scroller?.scrollTo({ top: 0 });
});
await page.waitForTimeout(200);
await page.screenshot({ path: `${OUT}/menu-full.png` });
console.log(`\n卡片截图 ${n} 张 + menu-full.png → ${OUT}`);

await ctx.close();
await browser.close();
