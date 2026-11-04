/**
 * 购物车页截图：订单页「再来一单」→ 落到 cart tab（唯一入口），验证「免配送费提示条」已移除
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';
const OUT = 'scripts/_shots';
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 4 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.waitForTimeout(600);

// 订单页 → 再来一单
await page.click('#nav-tab-orders');
await page.waitForTimeout(900);
const reorder = page.getByText('再来一单', { exact: true }).first();
await reorder.waitFor({ state: 'visible', timeout: 10000 });
await reorder.click();
await page.waitForTimeout(1200);

const info = await page.evaluate(() => {
  const bodyText = document.body.innerText;
  const bar = [...document.querySelectorAll('div')].find((d) =>
    /免外卖配送费|免配送费/.test(d.textContent || '') && d.children.length < 6
  );
  return {
    hasBannerText: /已享受满|即可享受免配送费/.test(bodyText),
    bannerNode: bar ? bar.className.slice(0, 80) : null,
    cartTitle: !!document.body.innerText.includes('购物车'),
  };
});
console.log(JSON.stringify(info, null, 2));

await page.screenshot({ path: `${OUT}/cart-page.png` });
const box = await page.evaluate(() => {
  const el = [...document.querySelectorAll('h2')].find((h) => h.textContent?.includes('购物车'));
  if (!el) return null;
  const shell = document.querySelector('#app-shell') || document.body;
  const r = el.getBoundingClientRect();
  const s = shell.getBoundingClientRect();
  return { x: s.x, y: s.y, w: s.width, h: s.height };
});
if (box) {
  await page.screenshot({
    path: `${OUT}/cart-top.png`,
    clip: { x: box.x, y: box.y, width: box.w, height: 340 },
  });
}
await browser.close();
