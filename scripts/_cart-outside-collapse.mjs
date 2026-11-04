import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 30000 }).catch(() => {});
await page.waitForFunction(() => {
  const s = document.getElementById('app-page-stage');
  return s && getComputedStyle(s).opacity === '1';
}, { timeout: 30000 });
await page.waitForTimeout(800);
// 1. 加购一件（点餐页第一张卡的加号）
const addBtn = page.locator('button[aria-label^="加入购物车"], button[aria-label^="查看详情"]').first();
// 点餐卡加号没有统一 aria-label，直接找青柠圆加号：卡内最后一个 button 里的 Plus
const plus = page.locator('.gb-hit button, button').filter({ has: page.locator('svg.lucide-plus') }).first();
await plus.click();
await page.waitForTimeout(1200);
const expanded1 = await page.evaluate(() => !!document.querySelector('.lucide-arrow-down, [class*="rotate-0"]') && document.body.innerText.includes('点击收起明细'));
console.log('加购后展开态(应 true):', expanded1);
// 2. 点购物车以外区域（页面顶部区域）
await page.mouse.click(215, 200);
await page.waitForTimeout(600);
const expanded2 = await page.evaluate(() => document.body.innerText.includes('点击收起明细'));
console.log('点外面后展开态(应 false):', expanded2);
// 3. 再展开（点结算栏），然后点购物车内部 → 不应收起
const bar = page.locator('text=点击查看已选商品').first();
await bar.click();
await page.waitForTimeout(600);
const expanded3 = await page.evaluate(() => document.body.innerText.includes('点击收起明细'));
console.log('重新展开(应 true):', expanded3);
// 点购物车面板内部（纯展示的规格文字，无任何 onClick）→ 不应收起
const specs = page.getByText(/标准碗|全麦烘焙|大杯/).first();
const sb = await specs.boundingBox();
await page.mouse.click(sb.x + sb.width / 2, sb.y + sb.height / 2);
await page.waitForTimeout(500);
const expanded4 = await page.evaluate(() => document.body.innerText.includes('点击收起明细'));
console.log('点面板内部后展开态(应 true):', expanded4);
await browser.close();
