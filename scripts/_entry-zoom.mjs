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
await page.locator('text=首页').first().click({ force: true }).catch(() => {});
await page.waitForTimeout(1800);
await skip();
await page.waitForTimeout(600);
const boxes = await page.evaluate(() => ['home-takeout-card','home-benefit-card'].map(id => {
  const r = document.getElementById(id).getBoundingClientRect();
  return { x: r.x, y: r.y, width: r.width, height: r.height };
}));
for (const [i, b] of boxes.entries()) {
  await page.screenshot({ path: `scripts/_entry-zoom-${i}.png`, clip: { x: b.x - 2, y: b.y - 2, width: b.width + 4, height: b.height + 4 } });
}
console.log(JSON.stringify(boxes));
await browser.close();
