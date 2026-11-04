/** 详情页那条「首杯 / 会员专享优惠」行：bg-rose-50/80 + border-rose-100（暖粉底）
 *  里的文字已改成 #FC259B（冷玫红）。暖底配冷字是最容易"脏"的组合，单独截出来看。 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';
const OUT = 'scripts/_shots/color';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 3 });
await page.route('**/fonts.googleapis.com/**', (r) => r.abort());
await page.route('**/fonts.gstatic.com/**', (r) => r.abort());
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.waitForTimeout(900);

const card = page.locator('text=牛油果鸡胸沙拉').first();
await card.evaluate((el) => el.scrollIntoView({ block: 'center' })).catch(() => {});
await page.waitForTimeout(400);
await card.click({ timeout: 4000 }).catch(() => {});
await page.waitForSelector('h1', { timeout: 6000 }).catch(() => {});
await page.waitForTimeout(1200);

// 找那行「首杯 / 会员专享优惠」
const row = await page.evaluate(() => {
  const els = [...document.querySelectorAll('div')];
  const el = els.find((e) => e.textContent && e.textContent.includes('首杯 / 会员专享优惠') && e.className.includes('rounded-lg'));
  if (!el) return null;
  el.scrollIntoView({ block: 'center' });
  const b = el.getBoundingClientRect();
  return { x: b.x - 6, y: b.y - 6, width: b.width + 12, height: b.height + 12, cls: el.className };
});
console.log(JSON.stringify(row));
await page.waitForTimeout(500);
if (row) await page.screenshot({ path: `${OUT}/detail-discount.png`, clip: row });
await browser.close();
