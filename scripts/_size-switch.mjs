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

fs.mkdirSync('scripts/_switch', { recursive: true });
const CLIP = { x: 0, y: 0, width: 390, height: 240 };
await page.screenshot({ path: 'scripts/_switch/f00-standard.png', clip: CLIP });

const large = page.locator('text=超大碗').first();
await large.scrollIntoViewIfNeeded().catch(() => {});
const t0 = Date.now();
await large.click().catch(e => console.log('click err', e.message.split('\n')[0]));

for (let i = 1; i <= 8; i++) {
  const ms = String(Date.now() - t0).padStart(3, '0');
  await page.screenshot({ path: 'scripts/_switch/f' + i + '-' + ms + 'ms.png', clip: CLIP });
  await page.waitForTimeout(40);
}
await page.waitForTimeout(700);

const info = await page.evaluate(() => [...document.querySelectorAll('img')]
  .filter(i => i.src.includes('/dishes/'))
  .map(i => {
    const r = i.getBoundingClientRect();
    return { src: i.currentSrc.split('/').slice(-2).join('/'), w: +r.width.toFixed(1), top: +r.top.toFixed(1) };
  }));
console.log(JSON.stringify(info));
await browser.close();
