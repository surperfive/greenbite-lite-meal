import { chromium } from 'playwright';

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
await page.route('**/fonts.googleapis.com/**', r => r.abort());
await page.route('**/fonts.gstatic.com/**', r => r.abort());
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });

async function skip() {
  for (let i = 0; i < 26; i++) {
    const b = page.locator('text=跳过').first();
    if (await b.count() && await b.isVisible().catch(() => false)) { await b.click({ force: true }).catch(() => {}); await page.waitForTimeout(200); }
    else await page.waitForTimeout(160);
  }
}
await skip();
await page.locator('text=我的').first().click({ force: true }).catch(() => {});
await page.waitForTimeout(2000);
await skip();
await page.waitForTimeout(600);
await page.screenshot({ path: 'scripts/_color/me-head.png', clip: { x: 0, y: 60, width: 390, height: 140 } });

// 购物车
await page.locator('text=点餐').first().click({ force: true }).catch(() => {});
await page.waitForTimeout(1600);
await skip();
const plus = page.locator('[aria-label="加入购物车"]').first();
if (await plus.count()) await plus.click({ force: true }).catch(() => {});
await page.waitForTimeout(600);
await page.locator('text=购物车').first().click({ force: true }).catch(() => {});
await page.waitForTimeout(1800);
await skip();
await page.waitForTimeout(600);
await page.screenshot({ path: 'scripts/_color/cart.png' });
await browser.close();
