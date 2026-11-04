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

// 内部滚动容器滚一点，触发 isScrolled 压缩
await page.evaluate(() => {
  const sc = [...document.querySelectorAll('div')].find(d => d.className.includes('overflow-y-auto') && d.scrollHeight > d.clientHeight + 20);
  sc.scrollTop = 60;
  sc.dispatchEvent(new Event('scroll', { bubbles: true }));
});
await page.waitForTimeout(700);

const data = await page.evaluate(() => {
  const h1 = document.querySelector('h1');
  const r = h1.getBoundingClientRect();
  const hero = document.querySelector('h1').closest('.flex-col');
  return { h1Top: +r.top.toFixed(1) };
});
console.log(JSON.stringify(data));
await page.screenshot({ path: 'scripts/_title-scrolled.png' });
await browser.close();
