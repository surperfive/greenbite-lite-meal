/**
 * 「我的」页整页截图（3×）。用法：node scripts/shot-me-ref.mjs
 * 输出 outputs/me-ref/me-after.png
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { BASE } from './_base.mjs';

const OUT = 'outputs/me-ref';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 3 });
await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
const page = await ctx.newPage();

await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#nav-tab-me', { timeout: 60000 });
await page.waitForTimeout(500);
await page.evaluate(() => {
  [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === '跳过')?.click();
});
await page.waitForTimeout(700);
await page.click('#nav-tab-me');
await page.waitForTimeout(1200);

const shell = await page.evaluate(() => {
  const el = document.querySelector('#nav-tab-me')?.closest('div[class*="w-[410px]"]')
    || document.querySelector('div[class*="w-[410px]"]');
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.x, y: r.y, w: r.width, h: r.height };
});
await page.screenshot({
  path: `${OUT}/me-after.png`,
  clip: shell ? { x: shell.x, y: shell.y, width: shell.w, height: Math.min(shell.h, 900) } : undefined
});
console.log(`输出：${OUT}/me-after.png`, shell);
await browser.close();
