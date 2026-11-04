/** 每个 tab 独立开页截图。
 *  ⚠️ 别在同一个 page 里"详情页 → Escape → 点下一个 tab"：详情是 z-50 覆盖层，
 *     Escape 后遮罩还在退场动画里，会吞掉紧随其后的导航点击，
 *     结果 orders / gacha 截出来还是上一页（上次就踩了，两张图完全一样）。
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';
const OUT = 'scripts/_shots/color';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
await ctx.route('**/fonts.googleapis.com/**', (r) => r.abort());
await ctx.route('**/fonts.gstatic.com/**', (r) => r.abort());

const grab = async (tabId, name) => {
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'commit' });
  await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
  await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
  await page.waitForTimeout(800);
  await page.click(`#nav-tab-${tabId}`, { timeout: 4000 }).catch(() => {});
  await page.waitForTimeout(1800);
  await page.waitForFunction(() => {
    const walk = (e) => {
      while (e && e !== document.documentElement) {
        if (parseFloat(getComputedStyle(e).opacity) < 0.999) return false;
        e = e.parentElement;
      }
      return true;
    };
    return walk(document.body);
  }, null, { timeout: 6000 }).catch(() => {});
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log(name, 'ok');
  await page.close();
};

await grab('orders', 'orders');
await grab('gacha', 'gacha');
await grab('me', 'me');
await browser.close();
