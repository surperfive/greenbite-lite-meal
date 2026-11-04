import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
import fs from 'node:fs';
const OUT = 'outputs/base-card/regress';
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 2 });
await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
const page = await ctx.newPage();
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#nav-tab-me', { timeout: 60000 });
let calm = 0;
for (let i = 0; i < 40 && calm < 2; i++) {
  if (!(await page.locator('[aria-label*="页面加载中"]').count())) { calm++; await page.waitForTimeout(450); continue; }
  calm = 0;
  await page.evaluate(() => [...document.querySelectorAll('button')].find(x => x.textContent?.trim().startsWith('跳过'))?.click());
  await page.waitForTimeout(400);
}
await page.click('#nav-tab-me');
await page.waitForTimeout(900);
const clicked = await page.evaluate(() => {
  const el = [...document.querySelectorAll('div,button,span')].find(e => e.textContent?.trim() === '健康计划');
  if (!el) return 'not found';
  (el.closest('button') || el.parentElement).click();
  return 'clicked';
});
console.log(clicked);
await page.waitForTimeout(1400);
await page.screenshot({ path: `${OUT}/05-health-plan.png` });
await browser.close();
