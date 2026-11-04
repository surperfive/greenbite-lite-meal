/**
 * 「小红点 + 价格」改成正红 #E60012 后的抓图校验。
 * 覆盖：首页 / 点餐页（含底部导航红点）/ 抽卡页 / 详情页 / 购物车弹层。
 * 用法：node scripts/shot-red.mjs
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { BASE } from './_base.mjs';

const OUT = 'outputs/red-unify';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 2 });
await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
const page = await ctx.newPage();

const freeze = () => page.evaluate(() => { window.requestAnimationFrame = () => 0; });

await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#nav-tab-menu', { timeout: 60000 });
await page.waitForTimeout(600);
await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((x) => x.textContent?.trim() === '跳过');
  b?.click();
});
await page.waitForTimeout(900);

const shot = async (name, prep) => {
  if (prep) await prep();
  await page.waitForTimeout(800);
  await freeze();
  await page.screenshot({ path: `${OUT}/${name}.png`, timeout: 60000 });
  console.log('captured', name);
};

// 点餐页（价格 + 底部导航「订单」红点 + 悬浮购物车红点）
await shot('01-menu', async () => { await page.click('#nav-tab-menu'); });

// 首页（菜品价格）
await shot('02-home', async () => { await page.click('#nav-tab-home'); });

// 抽卡页食材库（价格 15px 正红）
await shot('03-gacha', async () => {
  await page.click('#nav-tab-gacha');
  await page.waitForTimeout(900);
  await page.evaluate(() =>
    document.querySelector('#unified-pantry-collection-section')?.scrollIntoView({ block: 'center' })
  );
});

// 订单页（底部导航「订单」红点在整页最显眼）
await shot('04-orders', async () => { await page.click('#nav-tab-orders'); });

// 详情页（价格 + 首杯价 + 优惠行）
// ⚠️ 必须放最后：详情页没有底部导航，进去之后回不来（page.click('#nav-tab-*') 会超时）。
await shot('05-detail', async () => {
  await page.click('#nav-tab-menu');
  await page.waitForTimeout(600);
  await page.locator('div.cursor-pointer', { hasText: '牛油果鸡胸沙拉' }).first().click();
});

await browser.close();
console.log(`\n输出目录：${OUT}`);
