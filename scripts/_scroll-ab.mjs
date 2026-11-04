import { chromium } from 'playwright';

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await page.route('**/fonts.googleapis.com/**', r => r.abort());
await page.route('**/fonts.gstatic.com/**', r => r.abort());
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });

async function skip() {
  for (let i = 0; i < 26; i++) {
    const b = page.locator('text=跳过').first();
    if (await b.count() && await b.isVisible().catch(() => false)) {
      await b.click({ force: true }).catch(() => {});
      await page.waitForTimeout(200);
    } else {
      await page.waitForTimeout(150);
    }
  }
}

await skip();
await page.locator('text=点餐').first().click({ force: true }).catch(() => {});
await page.waitForTimeout(1700);
await skip();
const card = page.locator('text=牛油果鸡胸沙拉').first();
await card.evaluate(el => el.scrollIntoView({ block: 'center' })).catch(() => {});
await page.waitForTimeout(350);
await card.click().catch(() => {});
await page.waitForSelector('h1', { timeout: 8000 });
await page.waitForTimeout(1200);
await skip();
await page.waitForTimeout(700);

await page.mouse.move(195, 640);
await page.mouse.wheel(0, 300);
await page.waitForTimeout(250);
await page.mouse.wheel(0, 160);
await page.waitForTimeout(800);

const CLIP = { x: 0, y: 0, width: 390, height: 260 };
await page.screenshot({ path: 'scripts/_scroll-after.png', clip: CLIP });

// 还原旧参数 scale-85
await page.evaluate(() => {
  const h1 = document.querySelector('h1');
  const img = [...document.querySelectorAll('img')].find(i => i.src.includes('/dishes/'));
  let node = img;
  while (node && !(node.className && typeof node.className === 'string' && node.className.includes('z-30'))) node = node.parentElement;
  if (node) node.style.scale = '0.85';
  return node ? node.className : 'not-found';
});
await page.waitForTimeout(500);
await page.screenshot({ path: 'scripts/_scroll-before.png', clip: CLIP });

await browser.close();
