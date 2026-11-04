/**
 * 复查「立即购买」：确认 boxShadow/border 真的生效，并抓 3x 图。
 * 用法：node scripts/_buy-verify.mjs
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { BASE } from './_base.mjs';

const OUT = 'scripts/_buy';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 3 });
await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
const page = await ctx.newPage();

await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#nav-tab-menu', { timeout: 60000 });
await page.waitForTimeout(400);
await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((x) => x.textContent?.trim() === '跳过');
  b?.click();
});
await page.waitForTimeout(700);
await page.locator('div.cursor-pointer', { hasText: '牛油果鸡胸沙拉' }).first().click();
await page.waitForTimeout(1400);

const info = await page.evaluate(() => {
  const btns = [...document.querySelectorAll('button')];
  const buy = btns.filter((b) => b.textContent?.includes('立即购买')).pop();
  const add = btns.find((b) => b.textContent?.trim() === '加入购物车');
  buy.scrollIntoView({ block: 'center' });
  const cs = getComputedStyle(buy);
  return {
    border: `${cs.borderTopWidth} ${cs.borderTopStyle} ${cs.borderTopColor}`,
    boxShadow: cs.boxShadow,
    buyH: +buy.getBoundingClientRect().height.toFixed(2),
    addH: +add.getBoundingClientRect().height.toFixed(2),
  };
});
console.log(JSON.stringify(info, null, 1));

await page.waitForTimeout(400);
const box = await page.evaluate(() => {
  const btns = [...document.querySelectorAll('button')];
  const t = btns.filter((b) => b.textContent?.includes('立即购买')).pop();
  const r = t.getBoundingClientRect();
  return { x: 0, y: Math.max(0, r.top - 18), width: 420, height: r.height + 36 };
});
await page.screenshot({ path: `${OUT}/Z-最终.png`, clip: box, timeout: 60000 });
console.log('shot Z-最终', JSON.stringify(box));

await browser.close();
