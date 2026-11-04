/**
 * 生成「火焰图标描边色」候选对比图。
 * 不修改源码，用 addStyleTag 在页面内临时覆写 lucide 图标的 currentColor，
 * 一次渲染多组候选，方便直接比对可读性。
 *
 * 用法：node scripts/compare-flame-colors.mjs
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { BASE } from './_base.mjs';

const OUT = 'probe-out/calorie-chips';
mkdirSync(OUT, { recursive: true });

/** 候选：[色值, 标签]。第一项是当前源码里生效的值。 */
const CANDIDATES = [
  ['#EC4899', 'EC4899-pink500'],
  ['#DB2777', 'DB2777-pink600'],
  ['#BE185D', 'BE185D-pink700'],
  ['#9D174D', '9D174D-pink800']
];

const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({
  viewport: { width: 420, height: 900 },
  deviceScaleFactor: 4
});
const page = await ctx.newPage();

await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(600);
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === '跳过');
  btn?.click();
});
await page.waitForTimeout(900);
await page.click('#nav-tab-menu');
await page.waitForTimeout(1200);

const chip = page.locator('button', { hasText: '≤250大卡' }).first();
const box = await chip.boundingBox();
if (!box) throw new Error('未找到热量筛选胶囊');

for (let i = 0; i < CANDIDATES.length; i++) {
  const [hex, label] = CANDIDATES[i];
  const style = await page.addStyleTag({
    content: `button .lucide-flame { color: ${hex} !important; }`
  });
  await page.waitForTimeout(200);
  await page.screenshot({
    path: `${OUT}/cand-${i}-${label}.png`,
    clip: { x: 0, y: Math.max(0, box.y - 8), width: 420, height: box.height + 16 }
  });
  await style.evaluate((el) => el.remove());
  console.log('captured', label);
}

await browser.close();
console.log(`\n输出目录：${OUT}`);
