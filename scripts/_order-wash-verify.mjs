/**
 * 复查订单卡顶部渐变：确认真实 class 下的高度与渲染，并抓两张卡。
 * 用法：node scripts/_order-wash-verify.mjs
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { BASE } from './_base.mjs';

const OUT = 'scripts/_wash';
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
await page.waitForTimeout(600);
await page.locator('#nav-tab-orders').click();
await page.waitForTimeout(1200);

const info = await page.evaluate(() => {
  const els = [...document.querySelectorAll('div')].filter((d) => getComputedStyle(d).backgroundImage.includes('linear-gradient'));
  return els.slice(0, 2).map((e) => {
    const cs = getComputedStyle(e);
    return { h: cs.height, bg: cs.backgroundImage, cls: e.className };
  });
});
console.log(JSON.stringify(info, null, 1));

const box = await page.evaluate(() => {
  const els = [...document.querySelectorAll('div')].filter((d) => getComputedStyle(d).backgroundImage.includes('linear-gradient'));
  const card = els[0].parentElement;
  card.scrollIntoView({ block: 'center' });
  const r = card.getBoundingClientRect();
  return { x: Math.max(0, r.left - 6), y: Math.max(0, r.top - 6), width: Math.min(420, r.width + 12), height: r.height + 12 };
});
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/Z-最终.png`, clip: box, timeout: 60000 });
console.log('shot', JSON.stringify(box));

await browser.close();
