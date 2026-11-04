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

const data = await page.evaluate(() => {
  const h1 = document.querySelector('h1');
  const hr = h1.getBoundingClientRect();
  const sub = h1.nextElementSibling.getBoundingClientRect();
  const img = [...document.querySelectorAll('img')].find(i => i.alt && i.alt.includes('冷萃'));
  const ir = img.getBoundingClientRect();
  return {
    h1: { top: +hr.top.toFixed(1), bottom: +hr.bottom.toFixed(1) },
    sub: { top: +sub.top.toFixed(1), bottom: +sub.bottom.toFixed(1) },
    foodBox: { top: +ir.top.toFixed(1), bottom: +ir.bottom.toFixed(1) },
    gap: +(hr.top - (ir.top + ir.height * 0.945)).toFixed(1),
  };
});
console.log(JSON.stringify(data, null, 2));
await page.screenshot({ path: 'scripts/_title-after.png' });

// 顶部区域放大截图
await page.screenshot({ path: 'scripts/_title-after-zoom.png', clip: { x: 0, y: 130, width: 390, height: 130 } });

await browser.close();
