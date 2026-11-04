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
  await page.waitForTimeout(1800);
  await skip();

  const card = page.locator(`text=${name}`).first();
  await card.evaluate(el => el.scrollIntoView({ block: 'center' })).catch(() => {});
  await page.waitForTimeout(500);
  await card.click({ timeout: 6000 }).catch(async e => console.log('  click warn:', e.message.split('\n')[0]));
  await page.waitForTimeout(1800);
  await skip();
  await page.waitForTimeout(600);

  const t = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    return h1 ? +h1.getBoundingClientRect().top.toFixed(1) : null;
  });
  console.log(name, 'h1Top=', t);
  await page.screenshot({ path: `scripts/_food-${idx}.png` });
}
await browser.close();
