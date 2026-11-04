import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { BASE } from './_base.mjs';
mkdirSync('scripts/_banner', { recursive: true });
const name = process.argv[2] || 'home';
const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 2 });
await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
const page = await ctx.newPage();
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#nav-tab-menu', { timeout: 60000 });
await page.waitForTimeout(3200);
await page.locator('#nav-tab-home').click();
await page.waitForTimeout(800);
// 切到首页会再弹一次同款加载遮罩，点「跳过」
for (let i = 0; i < 6; i++) {
  const skip = page.locator('text=跳过').first();
  if (await skip.count()) {
    await skip.click({ timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(500);
  }
  const splashOn = await page.evaluate(() => document.body.innerText.includes('FRESH FOOD'));
  console.log('iter', i, 'splash', splashOn);
  if (!splashOn) break;
  await page.waitForTimeout(700);
}
await page.waitForTimeout(800);
await page.screenshot({ path: `scripts/_banner/${name}.png`, timeout: 60000 });
console.log('ok', name);
await browser.close();
