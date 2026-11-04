/**
 * 详情页「选中后副标题变绿」的对照抓图：标准碗(选中) vs 超大碗(未选中)。
 * 用法：node scripts/shot-detail-subtitle.mjs
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { BASE } from './_base.mjs';

const OUT = 'outputs/detail-subtitle';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 2 });
await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
const page = await ctx.newPage();

await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#nav-tab-menu', { timeout: 60000 });
await page.waitForTimeout(500);
await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((x) => x.textContent?.trim() === '跳过');
  b?.click();
});
await page.waitForTimeout(800);

// 打开第一道菜的详情
await page.locator('div.cursor-pointer', { hasText: '牛油果鸡胸沙拉' }).first().click();
await page.waitForTimeout(1500);

const shot = async (name) => {
  // 滚到「份量规格」附近并只截那一块
  await page.evaluate(() => {
    const el = [...document.querySelectorAll('span')].find((s) => s.textContent?.trim() === '份量规格');
    el?.scrollIntoView({ block: 'center' });
  });
  await page.waitForTimeout(700);
  await page.evaluate(() => { window.requestAnimationFrame = () => 0; });

  // 量出「份量规格」整块的矩形（从标题往下取 190px，覆盖两个规格按钮 + 主粮基底首行）
  const box = await page.evaluate(() => {
    const labels = [...document.querySelectorAll('span')].filter((s) => s.textContent?.trim() === '份量规格');
    if (!labels.length) return null;
    const r = labels[0].getBoundingClientRect();
    return { x: 8, y: Math.max(0, r.top - 10), width: 404, height: 195 };
  });
  await page.screenshot({ path: `${OUT}/${name}.png`, clip: box ?? undefined, timeout: 60000 });
  console.log('captured', name, JSON.stringify(box));
};

await shot('01-regular-selected');   // 默认选中「标准碗」

await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((x) => x.textContent?.includes('超大碗'));
  b?.click();
});
await page.waitForTimeout(900);
await shot('02-large-selected');

await browser.close();
console.log(`输出目录：${OUT}`);
