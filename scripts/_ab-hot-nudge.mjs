import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
import fs from 'node:fs';

const OUT = 'outputs/hot-nudge';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 4 });
await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
const page = await ctx.newPage();
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#nav-tab-menu', { timeout: 60000 });
for (let i = 0; i < 25; i++) {
  if (!(await page.locator('[aria-label*="页面加载中"]').count())) break;
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => x.textContent?.trim().startsWith('跳过'));
    b?.click();
  });
  await page.waitForTimeout(400);
}
await page.waitForTimeout(700);

// 只截「全部热卖」这颗卡（含 HOT）
const card = page.locator('button', { hasText: '全部热卖' }).first();
const b = await card.boundingBox();
const clip = { x: b.x - 2, y: b.y - 6, width: b.width + 8, height: b.height + 12 };

await card.screenshot({ path: `${OUT}/after.png` });

// 还原改前：margin-left 归零
await page.addStyleTag({ content: '#__noop{}' });
await page.evaluate(() => {
  const hot = [...document.querySelectorAll('span')].find((s) => s.textContent?.trim() === 'HOT');
  if (hot) hot.style.marginLeft = '0px';
});
await page.waitForTimeout(200);
await card.screenshot({ path: `${OUT}/before.png` });

// 整列
await page.evaluate(() => {
  const hot = [...document.querySelectorAll('span')].find((s) => s.textContent?.trim() === 'HOT');
  if (hot) hot.style.marginLeft = '';
});
await page.waitForTimeout(200);
const rail = page.locator('button', { hasText: '全部热卖' }).first().locator('xpath=..');
await rail.screenshot({ path: `${OUT}/rail.png` });

console.log('ok', { clip });
await browser.close();
