/** 量订单卡内部几何：色带 h-11(44px) 是否压到菜品缩略图。用法：node scripts/_orders-band-geom.mjs */
import { chromium } from 'playwright';
import { BASE } from './_base.mjs';

const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(600);
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === '跳过');
  btn?.click();
});
await page.waitForTimeout(1200);
await page.click('#nav-tab-orders');
await page.waitForTimeout(1200);

const out = await page.evaluate(() => {
  const card = document.querySelector('.rounded-\\[20px\\]');
  const c = card.getBoundingClientRect();
  const band = card.querySelector('.absolute.inset-x-0');
  const b = band.getBoundingClientRect();
  const header = card.children[1].getBoundingClientRect();
  const dishRow = card.children[2].getBoundingClientRect();
  const thumb = card.querySelector('.w-\\[66px\\]')?.getBoundingClientRect();
  const badge = card.querySelector('.rounded-full')?.getBoundingClientRect();
  const rel = (r) => ({ top: +(r.top - c.top).toFixed(1), bottom: +(r.bottom - c.top).toFixed(1) });
  return {
    cardH: +c.height.toFixed(1),
    band: rel(b),
    bandClass: band.className,
    bandBg: getComputedStyle(band).backgroundColor,
    bandImage: getComputedStyle(band).backgroundImage,
    header: rel(header),
    dishRow: rel(dishRow),
    thumb: thumb ? rel(thumb) : null,
    badge: badge ? rel(badge) : null,
  };
});
console.log(JSON.stringify(out, null, 2));
await ctx.close();
await browser.close();
