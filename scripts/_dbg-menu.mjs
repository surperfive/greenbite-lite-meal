import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await page.route('**/fonts.googleapis.com/**', r => r.abort());
await page.route('**/fonts.gstatic.com/**', r => r.abort());
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
async function skip() {
  for (let i = 0; i < 22; i++) {
    const b = page.locator('text=跳过').first();
    if (await b.count() && await b.isVisible().catch(() => false)) { await b.click({ force: true }).catch(() => {}); await page.waitForTimeout(220); }
    else await page.waitForTimeout(160);
  }
}
await skip();
await page.locator('text=点餐').first().click().catch(() => {});
await page.waitForTimeout(1500);
await skip();
const n = await page.locator('text=牛油果鸡胸沙拉').count();
console.log('count=', n);
await page.locator('text=牛油果鸡胸沙拉').first().click({ force: true }).catch(e => console.log('clickerr', e.message));
await page.waitForTimeout(2000);
console.log('h1=', await page.locator('h1').count());
console.log('title=', await page.locator('h1').first().textContent().catch(() => 'none'));
await page.screenshot({ path: 'scripts/_dbg-menu.png' });
await browser.close();
