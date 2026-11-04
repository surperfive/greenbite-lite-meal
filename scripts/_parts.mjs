import { chromium } from 'playwright';
import fs from 'fs';

const OUT = 'scripts/_color/parts';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
await page.route('**/fonts.googleapis.com/**', r => r.abort());
await page.route('**/fonts.gstatic.com/**', r => r.abort());

async function skip() {
  for (let i = 0; i < 26; i++) {
    const b = page.locator('text=跳过').first();
    if (await b.count() && await b.isVisible().catch(() => false)) { await b.click({ force: true }).catch(() => {}); await page.waitForTimeout(200); }
    else await page.waitForTimeout(160);
  }
}

async function shot(sel, name, nth = 0) {
  const el = page.locator(sel).nth(nth);
  if (!(await el.count())) { console.log('miss', name); return; }
  await el.screenshot({ path: `${OUT}/${name}.png` }).catch(e => console.log('err', name, e.message.split('\n')[0]));
}

// 点餐页
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await skip();
await page.locator('text=点餐').first().click({ force: true }).catch(() => {});
await page.waitForTimeout(2000);
await skip();
await page.waitForTimeout(700);
await page.screenshot({ path: 'scripts/_color/menu-content.png' });
await shot('text=TOP热销', 'top-badge');
await shot('text=8.0折', 'discount-pill');
await shot('text=生酮友好', 'keto-pill');

// 抽卡页
await page.locator('text=抽卡').first().click({ force: true }).catch(() => {});
await page.waitForTimeout(2000);
await skip();
await page.waitForTimeout(800);
const badge = page.locator('#badge-discount');
if (await badge.count()) await badge.screenshot({ path: `${OUT}/discount-9.png` }).catch(() => {});
await shot('#btn-header-tokens', 'gold-coin');

// 我的页
await page.locator('text=我的').first().click({ force: true }).catch(() => {});
await page.waitForTimeout(2000);
await skip();
await page.waitForTimeout(600);
await page.screenshot({ path: 'scripts/_color/me-content.png' });

// 详情页
await page.locator('text=点餐').first().click({ force: true }).catch(() => {});
await page.waitForTimeout(1600);
await skip();
const card = page.locator('text=牛油果鸡胸沙拉').first();
await card.evaluate(el => el.scrollIntoView({ block: 'center' })).catch(() => {});
await page.waitForTimeout(400);
await card.click().catch(() => {});
await page.waitForSelector('h1', { timeout: 8000 });
await page.waitForTimeout(1400);
await skip();
await page.waitForTimeout(700);
await page.screenshot({ path: 'scripts/_color/detail-content.png' });
await shot('text=NO.1', 'no1-badge');
await shot('text=已收藏', 'fav-btn');

await browser.close();
console.log('done');
