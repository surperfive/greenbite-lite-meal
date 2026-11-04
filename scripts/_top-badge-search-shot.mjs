/** 搜索弹窗 TOP 角标特写：确认和首页人气卡 HOT 块同一套玫红 + 黑字。 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';
const OUT = 'scripts/_shots';
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 3 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });

// 点餐页 → 点搜索胶囊
await page.click('#nav-tab-menu').catch(() => {});
await page.waitForTimeout(500);
await page.getByText('搜索轻食名称、热量数值...').first().click();
await page.waitForTimeout(700);

// 输入关键词拿到菜品结果（TOP 角标挂在 isPopular 的菜上）
const input = page.locator('input[type="text"], input:not([type])').first();
await input.fill('鸡');
await page.waitForTimeout(900);

const box = await page.evaluate(() => {
  const el = [...document.querySelectorAll('span')].find((s) => s.textContent.trim() === 'TOP');
  if (!el) return null;
  const card = el.closest('div.rounded-2xl') || el.parentElement.parentElement.parentElement;
  const b = card.getBoundingClientRect();
  return { x: Math.max(0, b.x), y: Math.max(0, b.y), width: b.width, height: Math.min(b.height, 260) };
});
if (box) await page.screenshot({ path: `${OUT}/top-badge-search.png`, clip: box });

const info = await page.evaluate(() => {
  const spans = [...document.querySelectorAll('span')].filter((s) => s.textContent.trim() === 'TOP');
  return spans.slice(0, 3).map((s) => {
    const cs = getComputedStyle(s);
    const b = s.getBoundingClientRect();
    return { bg: cs.backgroundColor, color: cs.color, w: +b.width.toFixed(1), h: +b.height.toFixed(1) };
  });
});
console.log(JSON.stringify(info));
await browser.close();
