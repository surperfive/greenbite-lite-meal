/**
 * 点餐页筛选行「全部」胶囊：未选中 / 选中 两态对照
 * 选中态 = 点任一个热量筛选，让 activeFilterCount > 0。
 * 用法：node scripts/shot-filter-pill.mjs [输出目录]
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE || 'http://127.0.0.1:5173/';
const OUT = process.argv[2] || 'outputs/filter-all-pill';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage({
  viewport: { width: 430, height: 932 },
  deviceScaleFactor: 3,
  locale: 'zh-CN',
});

await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#app-loading-screen', { state: 'attached', timeout: 10000 }).catch(() => {});
await page.waitForSelector('#app-loading-screen', { state: 'detached', timeout: 25000 }).catch(() => {});
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(600);

await page.click('#nav-tab-menu').catch(() => {});
await page.waitForTimeout(700);

const pill = page.locator('#filter-all-btn').first();
const rowWrap = pill.locator('xpath=..');

const probe = async (label) => {
  const data = await pill.evaluate((el) => {
    const s = getComputedStyle(el);
    const b = el.getBoundingClientRect();
    return {
      w: +b.width.toFixed(2),
      h: +b.height.toFixed(2),
      bg: s.backgroundColor,
      color: s.color,
      border: s.borderTopWidth + ' ' + s.borderTopColor,
      ring: s.boxShadow,
      weight: s.fontWeight,
      text: el.textContent.trim(),
    };
  });
  const box = await rowWrap.boundingBox();
  await page.screenshot({
    path: `${OUT}/${label}.png`,
    clip: { x: 0, y: Math.max(0, box.y - 10), width: 430, height: box.height + 20 },
  });
  return data;
};

const a = await probe('01-unselected');

const cal = page.locator('button:has-text("≤250大卡")').first();
await cal.click();
await page.waitForTimeout(650);
const b = await probe('02-selected');

console.log(JSON.stringify({ unselected: a, selected: b }, null, 2));
await browser.close();
