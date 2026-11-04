/**
 * 商品详情页组件/按钮改造后的抓图。
 * 用法：node scripts/shot-detail-ui.mjs
 *
 * ⚠️ 本机 playwright 的坑（见 MEMORY.md）：
 *   · 不能用 waitUntil:'domcontentloaded'（本机 Vite dev 某模块请求会 hang）
 *   · page.screenshot() 会卡在 "waiting for fonts to load"，必须 abort 外部字体
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { BASE } from './_base.mjs';

const OUT = 'outputs/detail-ui';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({
  viewport: { width: 420, height: 900 },
  deviceScaleFactor: 2
});
await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
const page = await ctx.newPage();

const freezeRaf = async () => {
  await page.evaluate(() => { window.requestAnimationFrame = () => 0; });
};

// 进入点餐页并打开第一道菜的详情
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#nav-tab-menu', { timeout: 60000 });
await page.waitForTimeout(600);
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === '跳过');
  btn?.click();
});
await page.waitForTimeout(900);
await page.click('#nav-tab-menu');
await page.waitForTimeout(800);

// 点第一张菜品卡（详情页入口）
// ⚠️ 不要用「找 div -> closest(cursor-pointer) -> dispatchEvent」的写法：
//    第一个 textContent 命中的 div 是页面级容器，事件路径里根本没有卡片本身，
//    dispatch 到容器上不会触发卡片的 onClick（实测反而误触了别处）。
//    直接用 Playwright 定位带 cursor-pointer 的菜品卡并真实点击。
await page.locator('div.cursor-pointer', { hasText: '牛油果鸡胸沙拉' }).first().click();
console.log('detail opened');
await page.waitForTimeout(1000);
await freezeRaf();
await page.screenshot({ path: `${OUT}/01-detail-top.png` });
console.log('captured 01-detail-top');

// 选中「超大碗」，看角标 + 选中态
await page.locator('button', { hasText: '超大碗' }).first().click();
await page.waitForTimeout(900);
await freezeRaf();
await page.screenshot({ path: `${OUT}/02-detail-large.png` });
console.log('captured 02-detail-large');

// 滚到选项区下半段（主粮基底 / 加料 / 底部栏）
await page.evaluate(() => {
  const sc = [...document.querySelectorAll('*')].find(
    (n) => n.scrollHeight > n.clientHeight + 20 && getComputedStyle(n).overflowY === 'auto'
  );
  if (sc) sc.scrollTop = sc.scrollHeight;
});
await page.waitForTimeout(700);
await freezeRaf();
await page.screenshot({ path: `${OUT}/03-detail-bottom.png` });
console.log('captured 03-detail-bottom');

// 展开价格构成气泡
await page.evaluate(() => document.getElementById('price-breakdown-trigger')?.click());
await page.waitForTimeout(700);
await freezeRaf();
await page.screenshot({ path: `${OUT}/04-detail-bubble.png` });
console.log('captured 04-detail-bubble');

await browser.close();
console.log(`\n输出目录：${OUT}`);
