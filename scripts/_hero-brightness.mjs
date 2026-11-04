/** 详情页 hero 背景亮度巡检：截 hero 区域 + 报平均亮度/暗部占比。
 *  用法：node scripts/_hero-brightness.mjs [tag]
 *  产物：scripts/_shots/hero-<tag>.png
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';
const OUT = 'scripts/_shots';
fs.mkdirSync(OUT, { recursive: true });
const tag = process.argv[2] || 'now';

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
await page.route('**/fonts.googleapis.com/**', (r) => r.abort());
await page.route('**/fonts.gstatic.com/**', (r) => r.abort());
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.waitForTimeout(900);

const card = page.locator('text=金枪鱼三明治').first();
await card.evaluate((el) => el.scrollIntoView({ block: 'center' })).catch(() => {});
await page.waitForTimeout(400);
await card.click({ timeout: 4000 }).catch(() => {});
await page.waitForSelector('h1', { timeout: 8000 }).catch(() => {});
await page.waitForTimeout(2200);   // 等远程背景图加载 + 入场动画

const clip = await page.evaluate(() => {
  const img = [...document.querySelectorAll('img')].find((i) => /unsplash|backdrops/.test(i.currentSrc || i.src));
  if (!img) return null;
  const b = img.getBoundingClientRect();
  return { x: b.x, y: b.y, width: b.width, height: b.height };
});
if (!clip) { console.log('没找到背景图'); process.exit(1); }
await page.screenshot({ path: `${OUT}/hero-${tag}.png`, clip });
console.log(JSON.stringify(clip));
await browser.close();
