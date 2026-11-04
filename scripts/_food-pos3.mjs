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

  // 用 JS 直接触发点击，绕开底部 tab bar 对坐标点击的遮挡
  const ok = await page.evaluate((n) => {
    const el = [...document.querySelectorAll('*')].find(e => e.children.length === 0 && e.textContent.trim() === n);
    if (!el) return 'no-el';
    let cur = el;
    for (let i = 0; i < 8 && cur; i++) {
      cur.click();
      cur = cur.parentElement;
    }
    return 'clicked';
  }, name);
  console.log(name, ok);

  await page.waitForSelector('h1', { timeout: 8000 });
  await page.waitForTimeout(1000);
  const t = await page.evaluate(() => +document.querySelector('h1').getBoundingClientRect().top.toFixed(1));
  console.log(name, 'h1Top=', t);
  await page.screenshot({ path: `scripts/_food-${idx}.png` });
}
await browser.close();
