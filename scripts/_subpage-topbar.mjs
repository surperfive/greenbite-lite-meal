/** 购物车 / 结算页顶部检查：全局胶囊会不会压住它们的顶栏按钮。 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';
fs.mkdirSync('scripts/_shots', { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#nav-tab-orders', { timeout: 20000 });
await page.waitForTimeout(1500);

await page.click('#nav-tab-orders');
await page.waitForTimeout(1200);
await page.screenshot({ path: 'scripts/_shots/top-orders-full.png' });

// 找「再来一单」
const reorder = page.locator('button').filter({ hasText: '再来一单' }).first();
if (await reorder.count()) {
  await reorder.click();
  await page.waitForTimeout(1400);
  await page.screenshot({ path: 'scripts/_shots/top-cart.png', clip: { x: 0, y: 0, width: 430, height: 160 } });
  const info = await page.evaluate(() => {
    const cap = document.querySelector('.pointer-events-none.absolute.right-3.top-2\\.5');
    const h = document.querySelector('h1, h2');
    return { hasCap: !!cap, capRect: cap?.getBoundingClientRect().toJSON(), title: h?.textContent?.trim() };
  });
  console.log('cart:', JSON.stringify(info));
} else {
  console.log('没有「再来一单」按钮');
}
console.log('errors:', errs.length ? errs : 'none');
await browser.close();
