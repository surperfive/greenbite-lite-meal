import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await page.route('**/fonts.googleapis.com/**', r => r.abort());
await page.route('**/fonts.gstatic.com/**', r => r.abort());

async function skip() {
  for (let i = 0; i < 26; i++) {
    const b = page.locator('text=跳过').first();
    if (await b.count() && await b.isVisible().catch(() => false)) { await b.click({ force: true }).catch(() => {}); await page.waitForTimeout(220); }
    else await page.waitForTimeout(180);
  }
}

for (const [idx, name] of [[4, '冷萃燕麦拿铁'], [5, '希腊酸奶杯']]) {
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await skip();
  await page.locator('text=点餐').first().click({ force: true }).catch(() => {});
  await page.waitForTimeout(2000);
  await skip();
  const card = page.locator(`text=${name}`).first();
  await card.scrollIntoViewIfNeeded().catch(() => {});
  await page.waitForTimeout(400);
  await card.click({ force: true });
  await page.waitForSelector('h1', { timeout: 8000 });
  await page.waitForTimeout(1000);
  const t = await page.evaluate(() => +document.querySelector('h1').getBoundingClientRect().top.toFixed(1));
  console.log(name, t);
  await page.screenshot({ path: `scripts/_food-${idx}.png` });
}
await browser.close();
