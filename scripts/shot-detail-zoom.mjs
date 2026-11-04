/**
 * 详情页改造后的局部放大校验：温度 / 主粮基底 / 加料 三行，
 * 确认右上角勾选徽章没有压到标题或副标题。
 * 用法：node scripts/shot-detail-zoom.mjs
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { BASE } from './_base.mjs';

const OUT = 'outputs/detail-ui';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({
  viewport: { width: 420, height: 900 },
  deviceScaleFactor: 3
});
await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
const page = await ctx.newPage();

await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#nav-tab-menu', { timeout: 60000 });
await page.waitForTimeout(600);
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === '跳过');
  btn?.click();
});
await page.waitForTimeout(900);
await page.click('#nav-tab-menu');
await page.waitForTimeout(700);
await page.locator('div.cursor-pointer', { hasText: '牛油果鸡胸沙拉' }).first().click();
await page.waitForTimeout(1200);
await page.evaluate(() => { window.requestAnimationFrame = () => 0; });

// 用每行分区标题定位，裁出「标题 + 卡片行」的区域
const regions = [
  ['zoom-temp', '温度'],
  ['zoom-base', '主粮基底'],
  ['zoom-addon', '个性化加料'],
];

for (const [name, label] of regions) {
  const box = await page.evaluate((text) => {
    // 找最内层、且文本以该标题开头的元素
    const all = [...document.querySelectorAll('div')].filter(
      (n) => n.textContent?.trim().startsWith(text)
    );
    const head = all[all.length - 1];
    if (!head) return null;
    const r = head.getBoundingClientRect();
    const h = text === '主粮基底' ? 96 : 74;
    return { x: 14, y: r.y - 2, width: 392, height: h };
  }, label);
  if (!box) { console.log('miss', name); continue; }
  await page.screenshot({ path: `${OUT}/${name}.png`, clip: box });
  console.log('captured', name, JSON.stringify(box));
}

await browser.close();
