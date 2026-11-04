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
    } else {
      await page.waitForTimeout(200);
    }
  }
}
await skipLoading();

// 进入点餐页
await page.locator('text=点餐').first().click().catch(() => {});
await page.waitForTimeout(1200);
await skipLoading();

// 打开冷萃燕麦拿铁详情
await page.locator('text=冷萃燕麦拿铁').first().click();
await page.waitForTimeout(1800);
await skipLoading();

const data = await page.evaluate(() => {
  const h1 = document.querySelector('h1');
  const img = document.querySelector('img[alt*="冷萃"], img[alt]');
  const imgs = [...document.querySelectorAll('img')].map(i => {
    const r = i.getBoundingClientRect();
    return { alt: i.alt, src: i.src.split('/').pop(), top: +r.top.toFixed(1), bottom: +r.bottom.toFixed(1), h: +r.height.toFixed(1) };
  }).filter(i => i.h > 100 && i.h < 300);
  const hr = h1?.getBoundingClientRect();
  const p = h1?.nextElementSibling?.getBoundingClientRect();
  return {
    h1: hr ? { top: +hr.top.toFixed(1), bottom: +hr.bottom.toFixed(1), text: h1.textContent } : null,
    sub: p ? { top: +p.top.toFixed(1), bottom: +p.bottom.toFixed(1) } : null,
    imgs,
  };
});
console.log(JSON.stringify(data, null, 2));

await page.screenshot({ path: 'scripts/_title-before.png' });
await browser.close();
