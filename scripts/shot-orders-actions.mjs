/**
 * 订单页「已完成」卡：校验按钮行顺序已对调为「去评价（白）→ 再来一单（黑）」。
 * 用法：node scripts/shot-orders-actions.mjs
 * 输出：outputs/orders-actions/*.png
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { BASE } from './_base.mjs';

const OUT = 'outputs/orders-actions';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 3 });
const page = await ctx.newPage();

await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#nav-tab-orders', { timeout: 60000 });
await page.waitForTimeout(600);
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === '跳过');
  btn?.click();
});
await page.waitForTimeout(1000);
await page.click('#nav-tab-orders');
await page.waitForTimeout(900);

await page.locator('button', { hasText: '已完成' }).first().click();
await page.waitForTimeout(700);

// 按钮行几何 + 顺序
const info = await page.evaluate(() => {
  const rows = [...document.querySelectorAll('div')].filter(
    (d) => d.className?.includes?.('pt-0') && d.querySelector('button') && /再来一单|去评价/.test(d.textContent || '')
  );
  return rows.map((row) => ({
    rowText: [...row.querySelectorAll('button')].map((b) => b.textContent?.trim()),
    buttons: [...row.querySelectorAll('button')].map((b) => {
      const r = b.getBoundingClientRect();
      const cs = getComputedStyle(b);
      return {
        text: b.textContent?.trim(),
        x: +r.x.toFixed(1),
        w: +r.width.toFixed(1),
        h: +r.height.toFixed(1),
        bg: cs.backgroundColor,
      };
    }),
  }));
});
console.log(JSON.stringify(info, null, 2));

// 逐卡截图
const rows = page.locator('div').filter({ has: page.locator('button:has-text("再来一单")') });
const cards = page.locator('.rounded-\\[20px\\]');
const n = await cards.count();
console.log('\n已完成卡片数:', n);
for (let i = 0; i < Math.min(n, 3); i++) {
  const card = cards.nth(i);
  const t = await card.textContent();
  if (!/去评价/.test(t || '')) continue;
  await card.scrollIntoViewIfNeeded();
  await page.waitForTimeout(150);
  await card.screenshot({ path: `${OUT}/done-card-${i + 1}.png` });
  // 按钮行特写
  const row = card.locator('div').filter({ has: page.locator('button:has-text("再来一单")') }).last();
  const b = await row.boundingBox();
  if (b) {
    await page.screenshot({
      path: `${OUT}/done-row-${i + 1}.png`,
      clip: { x: b.x - 4, y: b.y - 4, width: b.width + 8, height: b.height + 8 },
    });
  }
}

await page.screenshot({ path: `${OUT}/page.png` });

// 回归：进行中的卡不含「去评价」，按钮行顺序应保持原样（查看位置 / 加急催单 / 再来一单）
await page.locator('button', { hasText: '进行中' }).first().click();
await page.waitForTimeout(700);
const ongoing = await page.evaluate(() => {
  const row = [...document.querySelectorAll('div')].find(
    (d) => d.className?.includes?.('pt-0') && d.querySelector('button') && /再来一单/.test(d.textContent || '')
  );
  if (!row) return null;
  return [...row.querySelectorAll('button')].map((b) => {
    const r = b.getBoundingClientRect();
    return { text: b.textContent?.trim(), x: +r.x.toFixed(1), w: +r.width.toFixed(1) };
  });
});
console.log('\n进行中卡片按钮行:', JSON.stringify(ongoing));
await page.screenshot({ path: `${OUT}/ongoing.png` });

await browser.close();
console.log(`\n截图 → ${OUT}`);
