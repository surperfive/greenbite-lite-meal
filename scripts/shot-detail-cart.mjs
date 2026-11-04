/**
 * 商品详情页 / 购物车 的价格色抽查（红改 #FC5294 体系后）。
 * 用法：node scripts/shot-detail-cart.mjs [tag]
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const TAG = process.argv[2] || 'rose';
const OUT = 'outputs/detail-cart';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await page.goto('http://127.0.0.1:5173/', { waitUntil: 'commit' });
await page.waitForSelector('#nav-tab-menu', { state: 'visible', timeout: 30000 });
await page.waitForSelector('#app-loading-screen', { state: 'detached', timeout: 30000 }).catch(() => {});
await page.waitForTimeout(900);

for (let i = 0; i < 6; i++) {
  await page.evaluate(() => document.querySelector('#nav-tab-menu')?.click());
  await page.waitForTimeout(800);
  if (await page.evaluate(() => !!document.querySelector('#menu-header-banner'))) break;
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(1500);
}

// 点第一张菜品卡进详情（避开加号：点卡面标题区）
await page.getByText('牛油果鸡胸沙拉').first().click();
await page.waitForTimeout(1200);
await page.screenshot({ path: `${OUT}/${TAG}-detail.png` });

// 返回 → 加一份 → 打开购物车
await page.goBack().catch(() => {});
await page.waitForTimeout(1000);
const plus = page.locator('button[aria-label^="查看详情"]').first();
await plus.click({ timeout: 3000 }).catch(() => {});
await page.waitForTimeout(800);
await page.goBack().catch(() => {});
await page.waitForTimeout(900);

await browser.close();
console.log('ok ' + OUT);
