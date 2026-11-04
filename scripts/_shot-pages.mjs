import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
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
await page.waitForTimeout(500);
await page.screenshot({ path: 'scripts/_page-home.png' });
for (const [f, n] of [['_page-menu.png','点餐'], ['_page-gacha.png','抽卡'], ['_page-orders.png','订单'], ['_page-me.png','我的']]) {
  await page.locator(`text=${n}`).first().click({ force: true }).catch(() => {});
  await page.waitForTimeout(2000);
  await skip();
  await page.waitForTimeout(600);
  await page.screenshot({ path: `scripts/${f}` });
  console.log(n, 'done');
}
await browser.close();
