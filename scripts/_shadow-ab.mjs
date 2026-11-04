import { chromium } from 'playwright';

const OLD = 'drop-shadow(0 5px 8px rgba(0,0,0,0.20)) drop-shadow(0 14px 26px rgba(0,0,0,0.16)) drop-shadow(0 0 4px rgba(255,255,255,0.22)) drop-shadow(0 0 12px rgba(255,255,255,0.10))';
const CUR = 'drop-shadow(0 2px 3px rgba(0,0,0,0.26)) drop-shadow(0 4px 4px rgba(0,0,0,0.12)) drop-shadow(0 0 4px rgba(255,255,255,0.22)) drop-shadow(0 0 12px rgba(255,255,255,0.10))';

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
await page.waitForTimeout(500);

const clip = { x: 55, y: 145, width: 280, height: 100 };

// AFTER（当前阴影）
await page.screenshot({ path: 'scripts/_shadow-after-shot.png', clip });

// BEFORE（把 filter 临时换回旧参数）
await page.evaluate((f) => {
  document.querySelectorAll('img').forEach(i => {
    if (i.style.filter && i.style.filter.includes('drop-shadow')) i.style.filter = f;
  });
}, OLD);
await page.waitForTimeout(300);
await page.screenshot({ path: 'scripts/_shadow-before-shot.png', clip });

await browser.close();
console.log('ok');
