/**
 * 点餐页 6 张商品卡封面截图（groupDy 改前/改后对照用）。
 * ⚠️ 必须先把卡滚到视口中部再截：直接 locator.screenshot() 时，
 *    Playwright 对贴边的元素会给出视口裁剪的伪影图（拿铁那张盘底被"切"过）。
 * 用法：node scripts/_shot-gd.mjs <前缀>
 */
import { chromium } from 'playwright';
import { BASE } from './_base.mjs';

const PREFIX = process.argv[2] ?? 'gd';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 3 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
try {
  await page.waitForSelector('.brand-loader__skip', { timeout: 8000 });
  await page.click('.brand-loader__skip');
  await page.waitForSelector('.brand-loader__skip', { state: 'detached', timeout: 8000 });
} catch {}
await page.waitForTimeout(1200);

const n = await page.locator('[data-dish-thumb="true"]').count();
for (let i = 0; i < n; i++) {
  // 把第 i 张卡滚到列表视口中部
  await page.evaluate((idx) => {
    const list = [...document.querySelectorAll('.overflow-y-auto')].find((e) =>
      e.querySelector('[data-dish-thumb]')
    );
    const card = document.querySelectorAll('[data-dish-thumb="true"]')[idx]?.closest('.group');
    if (!list || !card) return;
    const lr = list.getBoundingClientRect();
    const cr = card.getBoundingClientRect();
    list.scrollTop += cr.top - lr.top - (lr.height - cr.height) / 2;
  }, i);
  await page.waitForTimeout(250);
  await page.locator('[data-dish-thumb="true"]').nth(i).screenshot({ path: `scripts/${PREFIX}-${i}.png` });
}
console.log('done', n, PREFIX);
await browser.close();
