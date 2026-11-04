import { chromium } from 'playwright';
import fs from 'fs';

const DISHES = [
  '牛油果鸡胸沙拉',
  '羽衣甘蓝酸奶昔',
  '金枪鱼三明治',
  '日式照烧鸡肉锅',
  '冷萃燕麦拿铁',
  '希腊酸奶杯'
];

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await page.route('**/fonts.googleapis.com/**', r => r.abort());
await page.route('**/fonts.gstatic.com/**', r => r.abort());
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });

async function skipLoading(max = 30) {
  for (let i = 0; i < max; i++) {
    const btn = page.locator('text=跳过').first();
    if (await btn.count() && await btn.isVisible().catch(() => false)) {
      await btn.click({ force: true }).catch(() => {});
      await page.waitForTimeout(220);
    } else {
      await page.waitForTimeout(140);
      if (i > 3) {
        const still = await page.locator('text=跳过').first().isVisible().catch(() => false);
        if (!still) return;
      }
    }
  }
}

async function openMenu() {
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await skipLoading();
  await page.locator('text=点餐').first().click({ force: true }).catch(() => {});
  await page.waitForTimeout(1200);
  await skipLoading();
}

const out = [];

for (const name of DISHES) {
  await openMenu(); // 每次重新进，避免返回态不一

  const card = page.locator(`text=${name}`).first();
  await card.scrollIntoViewIfNeeded().catch(() => {});
  await page.waitForTimeout(200);
  await card.click({ force: true }).catch(() => {});

  try {
    await page.waitForSelector('h1', { timeout: 4000 });
  } catch {
    await card.click({ force: true }).catch(() => {});
    await page.waitForSelector('h1', { timeout: 4000 });
  }
  await skipLoading();
  await page.waitForTimeout(700);

  const info = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    const r = h1.getBoundingClientRect();
    return { h1Top: +r.top.toFixed(1), title: h1.textContent.trim() };
  });

  await page.screenshot({ path: `scripts/_food-${DISHES.indexOf(name)}.png` });
  out.push({ name, ...info });
  console.log(name, info.h1Top);
}

fs.writeFileSync('scripts/_food-pos.json', JSON.stringify(out, null, 2));
await browser.close();
