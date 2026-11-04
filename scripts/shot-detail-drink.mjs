/**
 * 饮品类详情页（杯型 / 咖啡豆 / 糖度 四选）改造后的校验抓图。
 * 糖度原本是 grid-cols-2 sm:grid-cols-4，已统一成 2 列 —— 这里确认排版。
 * 用法：node scripts/shot-detail-drink.mjs
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { BASE } from './_base.mjs';

const OUT = 'outputs/detail-ui';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({
  viewport: { width: 420, height: 900 },
  deviceScaleFactor: 2
});
await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
const page = await ctx.newPage();

await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#nav-tab-menu', { timeout: 60000 });
await page.waitForTimeout(600);
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === '跳过');
  btn?.click();
});
await page.waitForTimeout(900);
await page.click('#nav-tab-menu');
await page.waitForTimeout(700);
await page.locator('div.cursor-pointer', { hasText: '冷萃燕麦拿铁' }).first().click();
await page.waitForTimeout(1200);
await page.evaluate(() => { window.requestAnimationFrame = () => 0; });
await page.screenshot({ path: `${OUT}/05-drink-top.png` });
console.log('captured 05-drink-top');

// 糖度那一行放大
const box = await page.evaluate(() => {
  const all = [...document.querySelectorAll('div')].filter((n) => n.textContent?.trim().startsWith('糖度'));
  const head = all[all.length - 1];
  if (!head) return null;
  const r = head.getBoundingClientRect();
  return { x: 14, y: r.y - 2, width: 392, height: 128 };
});
if (box) {
  await page.screenshot({ path: `${OUT}/06-drink-sweet.png`, clip: box });
  console.log('captured 06-drink-sweet');
}

await browser.close();
