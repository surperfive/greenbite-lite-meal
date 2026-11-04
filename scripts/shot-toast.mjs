/**
 * 截图全局 Toast，确认「65% 半透明黑 + 无 emoji」。
 * 用法：node scripts/shot-toast.mjs
 * 触发源：点餐页点「全部」→ `resetAllFilters()` 弹「已清空所有筛选」。
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { BASE } from './_base.mjs';

const OUT = 'outputs/toast';
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

// 先开一个筛选，让顶部按钮变成「全部 (1)」，再点它触发 toast
await page.getByText('≤250大卡').first().click();
await page.waitForTimeout(350);
await page.click('#filter-all-btn');
await page.waitForTimeout(260);

const info = await page.evaluate(() => {
  const el = [...document.querySelectorAll('div')].find(
    (d) => d.className.includes('bg-slate-900/65') && d.textContent?.trim()
  );
  if (!el) return null;
  const cs = getComputedStyle(el);
  return { text: el.textContent.trim(), bg: cs.backgroundColor, border: cs.borderColor, blur: cs.backdropFilter, box: el.getBoundingClientRect().toJSON() };
});
console.log(info);

await page.screenshot({ path: `${OUT}/toast.png`, clip: { x: 0, y: 30, width: 420, height: 110 } });
await page.screenshot({ path: `${OUT}/toast-wide.png` });
console.log(`\n截图 → ${OUT}`);

await ctx.close();
await browser.close();
