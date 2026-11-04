import { chromium } from 'playwright';

const OUT = 'scripts/_color';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await page.route('**/fonts.googleapis.com/**', r => r.abort());
await page.route('**/fonts.gstatic.com/**', r => r.abort());

async function skip() {
  for (let i = 0; i < 26; i++) {
    const b = page.locator('text=跳过').first();
    if (await b.count() && await b.isVisible().catch(() => false)) { await b.click({ force: true }).catch(() => {}); await page.waitForTimeout(200); }
    else await page.waitForTimeout(160);
  }
}

await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await skip();
await page.locator('text=首页').first().click({ force: true }).catch(() => {});
await page.waitForTimeout(1600);
await skip();
await page.waitForTimeout(700);
await page.screenshot({ path: `${OUT}/home.png` });

for (const [f, n] of [['menu', '点餐'], ['gacha', '抽卡'], ['orders', '订单'], ['me', '我的']]) {
  await page.locator(`text=${n}`).first().click({ force: true }).catch(() => {});
  await page.waitForTimeout(2000);
  await skip();
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/${f}.png` });
  console.log(n, 'ok');
}

// 详情页
await page.locator('text=点餐').first().click({ force: true }).catch(() => {});
await page.waitForTimeout(1600);
await skip();
const card = page.locator('text=牛油果鸡胸沙拉').first();
await card.evaluate(el => el.scrollIntoView({ block: 'center' })).catch(() => {});
await page.waitForTimeout(400);
await card.click().catch(() => {});
await page.waitForSelector('h1', { timeout: 8000 });
await page.waitForTimeout(1400);
await skip();
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/detail.png` });

await browser.close();
