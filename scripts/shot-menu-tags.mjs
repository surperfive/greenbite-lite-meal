/**
 * 点餐页商品卡左上角标：确认三颗角标是「白底 + 品牌玫红」，并打印实测色值。
 * 用法：node scripts/shot-menu-tags.mjs
 *
 * 判定口径（都从 computed style 取，不靠肉眼）：
 *   · backgroundColor 必须是 rgb(255,255,255)
 *   · color 必须是 rgb(252,82,148)（#FC5294，2026-10-29 12:35 起三颗统一；
 *     旧口径 GOLD_TEXT #8A5F00 / 0蔗糖深绿 #26430B 已作废）
 *   · TOP热销 比另两颗高 1.5px（多一颗 10px 火焰图标），属正常，别当高度 bug 修。
 *
 * ⚠️ Read 工具按路径缓存图片：重跑前先 `rm -rf outputs/menu-tags`，
 *    否则会把旧图当成"改动没生效"。
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { BASE } from './_base.mjs';

const OUT = 'outputs/menu-tags';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 3 });
const page = await ctx.newPage();

await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(700);

// LoadingScreen 是 fixed 全屏覆盖层，盯它的 aria-label 才可靠
for (let i = 0; i < 25; i++) {
  const loading = await page.locator('[aria-label*="页面加载中"]').count();
  if (!loading) break;
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find((b) => b.textContent?.trim().startsWith('跳过'));
    btn?.click();
  });
  await page.waitForTimeout(400);
}
console.log('loading 层剩余:', await page.locator('[aria-label*="页面加载中"]').count());

// 默认落地在点餐页
await page.waitForTimeout(900);

const REPORT = ['TOP热销', '暖心热食', '0蔗糖'];
const info = await page.evaluate((labels) => {
  const out = [];
  for (const label of labels) {
    const spans = [...document.querySelectorAll('span')].filter((s) => s.textContent?.trim() === label);
    for (const s of spans) {
      // 只取胶囊本体（父级带 rounded-full 的那层）
      const pill = s.parentElement?.className?.includes('rounded-full') ? s.parentElement : s;
      const cs = getComputedStyle(pill);
      const r = pill.getBoundingClientRect();
      out.push({
        label,
        text: pill.textContent?.trim(),
        bg: cs.backgroundColor,
        color: cs.color,
        shadow: cs.boxShadow,
        w: +r.width.toFixed(1),
        h: +r.height.toFixed(1),
      });
    }
  }
  return out;
}, REPORT);

console.log('\n角标实测：');
for (const it of info) {
  console.log(
    `  ${String(it.label).padEnd(6)} bg=${it.bg.padEnd(18)} color=${it.color.padEnd(16)} ${it.w}×${it.h}`
  );
}

// 卡片截图（每张含角标 + 盘子）
const cards = page.locator('[data-dish-thumb="true"]');
const n = await cards.count();
for (let i = 0; i < n; i++) {
  const card = cards.nth(i).locator('xpath=../..'); // 缩略图 > 卡片内容
  await card.scrollIntoViewIfNeeded();
  await page.waitForTimeout(120);
  await card.screenshot({ path: `${OUT}/card-${i + 1}.png` });
}

// 前四张卡的整块特写（对角标区域单独裁一刀，方便放大看字）
const b = await cards.first().boundingBox();
await page.screenshot({
  path: `${OUT}/tags-closeup.png`,
  clip: { x: b.x - 6, y: b.y - 8, width: b.width + 24, height: 46 },
});

await page.screenshot({ path: `${OUT}/menu.png` });

console.log(`\n截图 ${n} 张卡片 + 特写 → ${OUT}`);
await browser.close();
