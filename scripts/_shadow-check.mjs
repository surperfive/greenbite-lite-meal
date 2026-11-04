import { chromium } from 'playwright';

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await page.route('**/fonts.googleapis.com/**', r => r.abort());
await page.route('**/fonts.gstatic.com/**', r => r.abort());
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });

async function skipLoading() {
  for (let i = 0; i < 20; i++) {
    const btn = page.locator('text=跳过').first();
    if (await btn.count() && await btn.isVisible().catch(() => false)) {
      await btn.click({ force: true }).catch(() => {});
      await page.waitForTimeout(250);
    } else await page.waitForTimeout(200);
  }
}
await skipLoading();
await page.locator('text=点餐').first().click().catch(() => {});
await page.waitForTimeout(1200);
await skipLoading();
await page.locator('text=冷萃燕麦拿铁').first().click();
await page.waitForTimeout(1800);
await skipLoading();
await page.waitForTimeout(600);

await page.screenshot({ path: 'scripts/_shadow-standard.png' });
await page.screenshot({ path: 'scripts/_shadow-standard-zoom.png', clip: { x: 60, y: 150, width: 270, height: 110 } });

// 切大份
await page.locator('text=超大杯').first().click({ force: true }).catch(() => {});
await page.waitForTimeout(900);
await page.screenshot({ path: 'scripts/_shadow-large.png' });
await page.screenshot({ path: 'scripts/_shadow-large-zoom.png', clip: { x: 60, y: 150, width: 270, height: 110 } });

await browser.close();
console.log('shots ok');
