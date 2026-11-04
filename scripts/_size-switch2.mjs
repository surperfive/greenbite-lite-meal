import { chromium } from 'playwright';
import fs from 'fs';

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
      await page.waitForTimeout(160);
    }
  }
}

await skip();
await page.locator('text=点餐').first().click({ force: true }).catch(() => {});
await page.waitForTimeout(1800);
await skip();
const card = page.locator('text=牛油果鸡胸沙拉').first();
await card.evaluate(el => el.scrollIntoView({ block: 'center' })).catch(() => {});
await page.waitForTimeout(400);
await card.click().catch(() => {});
await page.waitForSelector('h1', { timeout: 8000 });
await page.waitForTimeout(1500);
await skip();
await page.waitForTimeout(800);

const CLIP = { x: 0, y: 0, width: 390, height: 240 };
fs.mkdirSync('scripts/_switch2', { recursive: true });

await page.locator('text=超大碗').first().click().catch(() => {});
await page.waitForTimeout(700);
await page.screenshot({ path: 'scripts/_switch2/a-large.png', clip: CLIP });

// 切回标准：60ms 与 700ms 各一帧
await page.locator('text=标准碗').first().click().catch(() => {});
await page.waitForTimeout(60);
await page.screenshot({ path: 'scripts/_switch2/b-back-60ms.png', clip: CLIP });
await page.waitForTimeout(640);
await page.screenshot({ path: 'scripts/_switch2/c-back-done.png', clip: CLIP });

// 切温度（热）看下坠是否仍在
const hotBtn = page.locator('text=热').first();
const hasHot = await hotBtn.count();
if (hasHot) {
  await hotBtn.click().catch(() => {});
  await page.waitForTimeout(70);
  await page.screenshot({ path: 'scripts/_switch2/d-temp-70ms.png', clip: CLIP });
}
console.log('done, hot=', hasHot);
await browser.close();
