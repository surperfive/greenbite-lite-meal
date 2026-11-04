/**
 * 订单页截图：商品缩略图改前/改后对照用。
 * ⚠️ tab 必须用 `#nav-tab-orders` 点（BottomNavBar 给每个按钮都写了 id）——
 *    早先版本用 `children.length===0 && textContent==='订单'` 找元素，**永远匹配不到**
 *    （tab 按钮里有图标 div + 文字 span），结果静默留在点餐页、截了一张菜单页冒充验证。
 * ⚠️ 点完必须等订单页特征元素出现（搜索框 placeholder 含「订单」）再截图。
 * 用法：node scripts/_shot-orders.mjs <输出.png>
 */
import { chromium } from 'playwright';
import { BASE } from './_base.mjs';

const OUT = process.argv[2] ?? 'scripts/_orders-shot.png';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 3 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
try {
  await page.waitForSelector('.brand-loader__skip', { timeout: 8000 });
  await page.click('.brand-loader__skip');
  await page.waitForSelector('.brand-loader__skip', { state: 'detached', timeout: 8000 });
} catch {}
await page.waitForTimeout(1000);
// 进「订单」tab（稳定 id 选择器）
await page.click('#nav-tab-orders', { timeout: 5000 });
// 等订单页特征元素：搜索框 placeholder 含「订单」
await page.waitForSelector('input[placeholder*="订单"]', { timeout: 8000 });
// ⚠️ 切 tab 会触发 App 的开屏加载页（FRESH FOOD loader），必须等它彻底退场，
//    否则会截到半透明加载层压在订单页上的图（改前那次就踩了）。
try {
  await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 10000 });
} catch {}
await page.waitForTimeout(900);
await page.screenshot({ path: OUT, fullPage: false });
// 自检：确认真的在订单页（有「再来一单」按钮）
const onOrders = await page.evaluate(() =>
  [...document.querySelectorAll('button')].some((b) => b.textContent.includes('再来一单'))
);
console.log('saved', OUT, '| onOrdersPage:', onOrders);
await browser.close();
