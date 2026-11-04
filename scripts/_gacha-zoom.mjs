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
await page.locator('text=抽卡').first().click({ force: true }).catch(() => {});
await page.waitForTimeout(2200);
await skip();
await page.waitForTimeout(800);
await page.screenshot({ path: 'scripts/_color/gacha-zoom.png', clip: { x: 210, y: 285, width: 180, height: 90 } });
await page.screenshot({ path: 'scripts/_color/gacha-head.png', clip: { x: 0, y: 0, width: 390, height: 60 } });
await browser.close();
