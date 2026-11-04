/** 「我的」页顶部 banner 改前/改后 A/B（同一裁切框，直接对比）。 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';
const OUT = 'scripts/_shots';
fs.mkdirSync(OUT, { recursive: true });
const CLIP = { x: 10, y: 0, width: 410, height: 272 };

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 3 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.click('#nav-tab-me');
await page.waitForTimeout(1300);

// 改后（现在）
await page.screenshot({ path: `${OUT}/me-after.png`, clip: CLIP });

// 还原改前：pt 48 / pb 56 / min-h 174 / 白卡 -mt-9
await page.evaluate(() => {
  const img = document.querySelector('img[alt="我的页面头图Banner"]');
  const banner = img.closest('div.relative.overflow-hidden');
  banner.style.paddingTop = '48px';
  banner.style.paddingBottom = '56px';
  banner.style.minHeight = '174px';
  const card = banner.nextElementSibling;
  card.style.marginTop = '-36px';
});
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/me-before.png`, clip: CLIP });
const h = await page.evaluate(() => {
  const img = document.querySelector('img[alt="我的页面头图Banner"]');
  return img.closest('div.relative.overflow-hidden').getBoundingClientRect().height;
});
console.log('还原后 banner 高', h);
await browser.close();
