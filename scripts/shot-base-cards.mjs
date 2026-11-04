/**
 * 详情页「主粮基底 / 咖啡豆」三列卡：量取底色、描边、勾选环，并出 3x 截图。
 * 用法：node scripts/shot-base-cards.mjs [菜品名]
 */
import { chromium } from 'playwright';
import { BASE } from './_base.mjs';

const DISH = process.argv[2] || '牛油果鸡胸沙拉';
const TAG = process.argv[3] || 'after';
const OUT = `outputs/base-card/${TAG}`;
const fs = await import('node:fs');
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

// 找到「主粮基底 / 咖啡豆」标题，取它的父 div（整个 Spec 3 区块）
const title = page.locator('span', { hasText: /^(主粮基底|咖啡豆)$/ }).first();
await title.scrollIntoViewIfNeeded();
await page.waitForTimeout(400);

const info = await page.evaluate(() => {
  const label = [...document.querySelectorAll('span')].find((s) =>
    /^(主粮基底|咖啡豆)$/.test(s.textContent?.trim() || '')
  );
  const block = label?.parentElement?.parentElement;
  if (!block) return { err: 'block not found' };
  const grid = block.querySelector('div.grid');
  const cards = [...(grid?.children || [])];
  const read = (el) => {
    const cs = getComputedStyle(el);
    return {
      text: el.textContent?.replace(/\s+/g, ' ').trim().slice(0, 40),
      bg: cs.backgroundColor,
      border: `${cs.borderTopWidth} ${cs.borderTopColor}`,
      radius: cs.borderTopLeftRadius,
      shadow: cs.boxShadow,
      ring: cs.boxShadow.includes('inset') ? 'ring' : '',
      w: +el.getBoundingClientRect().width.toFixed(1),
      h: +el.getBoundingClientRect().height.toFixed(1),
    };
  };
  const r = block.getBoundingClientRect();
  return { cards: cards.map(read), block: { x: r.x, y: r.y, w: r.width, h: r.height } };
});
console.log(JSON.stringify(info, null, 2));

const block = await page.evaluate(() => {
  const label = [...document.querySelectorAll('span')].find((s) =>
    /^(主粮基底|咖啡豆)$/.test(s.textContent?.trim() || '')
  );
  const block = label?.parentElement?.parentElement;
  const r = block.getBoundingClientRect();
  return { x: r.x, y: r.y, w: r.width, h: r.height };
});
await page.screenshot({
  path: `${OUT}/section.png`,
  clip: {
    x: Math.max(0, block.x - 8),
    y: Math.max(0, block.y - 18),
    width: Math.min(420, block.w + 16),
    height: block.h + 30,
  },
});

// 未选中 → 点第三张，再拍一次（对比选中态）
const cards = page.locator('span', { hasText: /^(主厨推荐|控卡优选|生酮必选|IIAC金奖|咖啡更浓|IIAC铂金)$/ });
await page.screenshot({ path: `${OUT}/page.png` });

console.log(`\n截图 → ${OUT}`);
await browser.close();
