import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await page.route('**/fonts.googleapis.com/**', r => r.abort());
await page.route('**/fonts.gstatic.com/**', r => r.abort());
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
async function skip() {
  for (let i = 0; i < 26; i++) {
    const b = page.locator('text=跳过').first();
    if (await b.count() && await b.isVisible().catch(() => false)) { await b.click({ force: true }).catch(() => {}); await page.waitForTimeout(220); }
    else await page.waitForTimeout(180);
  }
}
await skip();
await page.locator('text=点餐').first().click({ force: true }).catch(() => {});
await page.waitForTimeout(1800);
await skip();
const card = page.locator('text=牛油果鸡胸沙拉').first();
await card.evaluate(el => el.scrollIntoView({ block: 'center' })).catch(() => {});
await page.waitForTimeout(400);
await card.click();
await page.waitForSelector('h1', { timeout: 8000 });
await page.waitForTimeout(1500);
await skip();
await page.waitForTimeout(600);
await page.screenshot({ path: 'scripts/_avocado-page.png' });
await page.screenshot({ path: 'scripts/_avocado-hero.png', clip: { x: 0, y: 0, width: 390, height: 260 } });
const src = await page.evaluate(() => {
  const img = [...document.querySelectorAll('img')].find(i => i.src.includes('/backdrops/'));
  return img ? { src: img.src, w: img.naturalWidth, h: img.naturalHeight, complete: img.complete } : null;
});
console.log(JSON.stringify(src));
await browser.close();
