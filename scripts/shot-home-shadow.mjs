/**
 * 首页卡片阴影：核对与「我的」页同口径（白卡 0 4 16 / 0.06，彩色卡 0 4 16 / 0.10）。
 * 用法：node scripts/shot-home-shadow.mjs
 * 输出：outputs/home-shadow/*.png
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { BASE } from './_base.mjs';

const OUT = 'outputs/home-shadow';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 3 });
await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
const page = await ctx.newPage();

await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#nav-tab-home', { timeout: 60000 });
await page.waitForTimeout(800);

// LoadingScreen 是 `.brand-loader` 全屏覆盖层（内部「跳过」按钮 `.brand-loader__skip`），
// 它盖在 app 之上，不点掉的话后续 click 都会被它挡。点完等它真的移除。
if (await page.locator('.brand-loader').count()) {
  await page.locator('.brand-loader__skip').click({ timeout: 5000 }).catch(() => {});
  await page.locator('.brand-loader').waitFor({ state: 'detached', timeout: 15000 }).catch(() => {});
}
console.log('loading 层剩余:', await page.locator('.brand-loader').count());

// 默认落地在点餐页（首页卡此时还没挂载），必须点一次首页 tab
await page.click('#nav-tab-home');
await page.waitForSelector('#home-takeout-card', { state: 'visible', timeout: 30000 });
await page.waitForTimeout(1200);
// 默认落地在点餐页，回首页
await page.click('#nav-tab-home');
await page.waitForSelector('#home-takeout-card', { state: 'visible', timeout: 30000 });
await page.waitForTimeout(1200);

const ids = ['home-takeout-card', 'home-pickup-card', 'home-gacha-card', 'home-benefit-card', 'home-signature-card', 'home-invite-card'];

const report = await page.evaluate((ids) => {
  const out = [];
  for (const id of ids) {
    const el = document.getElementById(id);
    if (!el) {
      out.push({ id, missing: true });
      continue;
    }
    out.push({ id, shadow: getComputedStyle(el).boxShadow });
  }
  // 商品卡没有 id，取「人气当季轻食」网格里的第一张
  const sec = document.getElementById('home-popular-dishes-section');
  const dish = sec?.querySelector('.grid > div');
  out.push({ id: 'popular-dish', shadow: dish ? getComputedStyle(dish).boxShadow : null });
  // 对照：我的页白卡口径
  out.push({ id: 'ref-me-white', shadow: '0px 4px 16px rgba(0,0,0,0.06)' });
  out.push({ id: 'ref-me-color', shadow: '0px 4px 16px rgba(0,0,0,0.10)' });
  return out;
}, ids);

console.log('=== 首页卡片阴影 ===');
report.forEach((r) => console.log((r.id + '').padEnd(20), r.shadow ?? `(未找到: ${r.missing})`));

// 截图：四入口
const grid = page.locator('#home-takeout-card').locator('xpath=../../..');
await grid.scrollIntoViewIfNeeded();
await page.waitForTimeout(200);
await page.screenshot({ path: `${OUT}/01-entry-grid.png`, clip: await clipOf(grid, page) });

// 两张大卡
const sig = page.locator('#home-signature-card');
await sig.scrollIntoViewIfNeeded();
await page.waitForTimeout(200);
const twoCards = sig.locator('xpath=..');
await page.screenshot({ path: `${OUT}/02-big-cards.png`, clip: await padClip(twoCards, page, 8) });

// 商品卡
const popGrid = page.locator('#home-popular-dishes-section .grid').first();
await popGrid.scrollIntoViewIfNeeded();
await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}/03-dishes.png`, clip: await padClip(popGrid, page, 8) });

// 整屏
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}/00-full.png`, fullPage: true });

// 与「我的」页对照
await page.click('#nav-tab-me');
await page.waitForTimeout(1200);
await page.screenshot({ path: `${OUT}/04-me.png`, fullPage: true });

await browser.close();
console.log(`\n截图 → ${OUT}`);

async function clipOf(locator, page) {
  const b = await locator.boundingBox();
  return { x: Math.max(0, b.x), y: Math.max(0, b.y), width: b.width, height: b.height };
}
async function padClip(locator, page, pad) {
  const b = await locator.boundingBox();
  return {
    x: Math.max(0, b.x - pad),
    y: Math.max(0, b.y - pad),
    width: Math.min(420, b.width + pad * 2),
    height: b.height + pad * 2,
  };
}
