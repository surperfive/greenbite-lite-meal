import { chromium } from 'playwright';
import fs from 'fs';

const DISHES = [
  ['牛油果鸡胸沙拉', 'salad'],
  ['日式照烧鸡肉锅', 'teriyaki'],
  ['金枪鱼三明治', 'sandwich'],
  ['希腊酸奶杯', 'yogurt'],
  ['冷萃燕麦拿铁', 'latte'],
  ['羽衣甘蓝酸奶昔', 'smoothie'],
];

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await page.route('**/fonts.googleapis.com/**', r => r.abort());
await page.route('**/fonts.gstatic.com/**', r => r.abort());

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

fs.mkdirSync('scripts/_scrollset', { recursive: true });

for (const [name, slug] of DISHES) {
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await skip();
  await page.locator('text=点餐').first().click({ force: true }).catch(() => {});
  await page.waitForTimeout(1700);
  await skip();
  const card = page.locator('text=' + name).first();
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

  await page.screenshot({ path: `scripts/_scrollset/${slug}.png`, clip: { x: 0, y: 0, width: 390, height: 200 } });
  const info = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    const food = [...document.querySelectorAll('img')].find(i => i.src.includes('/dishes/'));
    const b = food.getBoundingClientRect();
    return { foodTop: +b.top.toFixed(1), foodBottom: +b.bottom.toFixed(1), h1Top: +h1.getBoundingClientRect().top.toFixed(1) };
  });
  console.log(slug, JSON.stringify(info));
}

await browser.close();
