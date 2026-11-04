/**
 * 四卡标签「主 + 次」一对的特写（4x），用来判断主标签的金字在白底上够不够「值」。
 * 用法：node scripts/_zoom-home-tags.mjs
 * 输出：outputs/home-tags-zoom/
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { BASE } from './_base.mjs';

const OUT = 'outputs/home-tags-zoom';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 4 });
await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
const page = await ctx.newPage();

await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#nav-tab-home', { timeout: 60000 });
await page.waitForTimeout(800);
for (let i = 0; i < 25; i++) {
  if (!(await page.locator('.brand-loader').count())) break;
  await page.locator('.brand-loader__skip').click({ timeout: 1200 }).catch(() => {});
  await page.waitForTimeout(400);
}
await page.click('#nav-tab-home');
await page.waitForSelector('#home-takeout-card', { state: 'visible', timeout: 30000 });
await page.waitForTimeout(1200);
for (let i = 0; i < 25; i++) {
  if (!(await page.locator('.brand-loader').count())) break;
  await page.locator('.brand-loader__skip').click({ timeout: 1200 }).catch(() => {});
  await page.waitForTimeout(400);
}

const pair = page.locator('#home-takeout-card div.absolute.left-3\\.5').first();
await pair.scrollIntoViewIfNeeded();
await page.waitForTimeout(250);
const b = await pair.boundingBox();
console.log('pair box:', JSON.stringify(b));
await page.screenshot({
  path: `${OUT}/pair.png`,
  clip: { x: b.x - 8, y: b.y - 8, width: b.width + 16, height: b.height + 16 },
});
await browser.close();
console.log('→', OUT);
