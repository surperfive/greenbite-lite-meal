/**
 * 详情页「主粮基底 / 咖啡豆」浮动胶囊：量取底色 / 字色 / 描边 / 尺寸，并出特写。
 * 用法：node scripts/shot-base-pills.mjs [菜品名] [标签]
 */
import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
import fs from 'node:fs';

const DISH = process.argv[2] || '牛油果鸡胸沙拉';
const TAG = process.argv[3] || 'after';
const OUT = `outputs/base-pills/${TAG}`;
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 3 });
await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
const page = await ctx.newPage();

await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#nav-tab-menu', { timeout: 60000 });
let calm = 0;
for (let i = 0; i < 40 && calm < 2; i++) {
  if (!(await page.locator('[aria-label*="页面加载中"]').count())) {
    calm++;
    await page.waitForTimeout(500);
    continue;
  }
  calm = 0;
  await page.evaluate(() =>
    [...document.querySelectorAll('button')].find((x) => x.textContent?.trim().startsWith('跳过'))?.click()
  );
  await page.waitForTimeout(400);
}
await page.click('#nav-tab-menu');
await page.waitForTimeout(800);
await page.locator('div.cursor-pointer', { hasText: DISH }).first().click();
await page.waitForTimeout(1500);

const title = page.locator('span', { hasText: /^(主粮基底|咖啡豆)$/ }).first();
await title.scrollIntoViewIfNeeded();
await page.waitForTimeout(450);

const info = await page.evaluate(() => {
  const label = [...document.querySelectorAll('span')].find((s) =>
    /^(主粮基底|咖啡豆)$/.test(s.textContent?.trim() || '')
  );
  const block = label?.parentElement?.parentElement;
  const grid = block?.querySelector('div.grid');
  const cards = [...(grid?.children || [])];
  return cards.map((card) => {
    const pill = card.querySelector('span.absolute');
    const cs = pill ? getComputedStyle(pill) : null;
    const r = pill?.getBoundingClientRect();
    const cr = card.getBoundingClientRect();
    return {
      pill: pill?.textContent?.trim(),
      bg: cs?.backgroundColor,
      color: cs?.color,
      border: cs ? `${cs.borderTopWidth} ${cs.borderTopStyle} ${cs.borderTopColor}` : '',
      w: r ? +r.width.toFixed(1) : 0,
      h: r ? +r.height.toFixed(1) : 0,
      // 胶囊顶相对卡片顶（负值 = 悬出卡片）
      topVsCard: r ? +(r.top - cr.top).toFixed(1) : 0,
      selected: !!card.querySelector('svg.lucide-check') || cs?.backgroundColor === 'rgb(199, 246, 101)',
    };
  });
});
console.log(JSON.stringify(info, null, 2));

const block = await page.evaluate(() => {
  const label = [...document.querySelectorAll('span')].find((s) =>
    /^(主粮基底|咖啡豆)$/.test(s.textContent?.trim() || '')
  );
  const b = label?.parentElement?.parentElement;
  const r = b.getBoundingClientRect();
  return { x: r.x, y: r.y, w: r.width, h: r.height };
});
await page.screenshot({
  path: `${OUT}/section.png`,
  clip: {
    x: Math.max(0, block.x - 8),
    y: Math.max(0, block.y - 20),
    width: Math.min(420, block.w + 16),
    height: block.h + 32,
  },
});

// 单颗胶囊 4x 特写（第一张未选中卡）
const pillBox = await page.evaluate(() => {
  const label = [...document.querySelectorAll('span')].find((s) =>
    /^(主粮基底|咖啡豆)$/.test(s.textContent?.trim() || '')
  );
  const grid = label.parentElement.parentElement.querySelector('div.grid');
  const cards = [...grid.children];
  const card = cards[1];
  const pill = card.querySelector('span.absolute');
  const pr = pill.getBoundingClientRect();
  const cr = card.getBoundingClientRect();
  return { px: pr.x, py: pr.y, pw: pr.width, ph: pr.height, cx: cr.x, cy: cr.y, cw: cr.width, ch: cr.height };
});
await page.screenshot({
  path: `${OUT}/pill.png`,
  clip: {
    x: Math.max(0, pillBox.px - 10),
    y: Math.max(0, pillBox.py - 8),
    width: pillBox.pw + 20,
    height: pillBox.ph + 16,
  },
});
await page.screenshot({
  path: `${OUT}/card.png`,
  clip: {
    x: pillBox.cx - 6,
    y: pillBox.py - 8,
    width: Math.min(420 - pillBox.cx + 6, pillBox.cw + 12),
    height: pillBox.ch + (pillBox.cy - pillBox.py) + 14,
  },
});

console.log(`\n截图 → ${OUT}`);
await browser.close();
