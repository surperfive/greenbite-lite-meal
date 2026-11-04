/** 品牌粉 #EC4899 与新玫红 #FC259B 并排观感检查（搜索弹窗里两者同屏）。 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';
const OUT = 'scripts/_shots/color';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 3 });
await page.route('**/fonts.googleapis.com/**', (r) => r.abort());
await page.route('**/fonts.gstatic.com/**', (r) => r.abort());
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.waitForTimeout(900);

// 点餐页搜索框 → 输入关键词
await page.click('#nav-tab-menu', { timeout: 4000 }).catch(() => {});
await page.waitForTimeout(1200);
const box = page.locator('input[placeholder*="搜索"]').first();
await box.click({ timeout: 4000 }).catch(() => {});
await page.waitForTimeout(600);
await box.fill('沙拉', { timeout: 4000 }).catch(() => {});
await page.waitForTimeout(1200);

const modal = page.locator('#search-modal, [role="dialog"]').first();
if (await modal.count()) {
  const b = await modal.boundingBox();
  if (b) await page.screenshot({ path: `${OUT}/search.png`, clip: b });
  else await page.screenshot({ path: `${OUT}/search.png` });
} else {
  await page.screenshot({ path: `${OUT}/search.png` });
}
console.log('search ok');

// 纯色对照条：#EC4899 vs #FC259B 各 120×40 相邻
await page.setContent(`
  <body style="margin:0;background:#fff;display:flex;font:700 13px/40px system-ui">
    <div style="width:160px;height:40px;background:#EC4899;color:#fff;text-align:center">#EC4899 旧粉</div>
    <div style="width:160px;height:40px;background:#FC259B;color:#fff;text-align:center">#FC259B 新玫红</div>
  </body>`);
await page.waitForTimeout(200);
await page.screenshot({ path: `${OUT}/swatch.png`, clip: { x: 0, y: 0, width: 320, height: 40 } });
console.log('swatch ok');
await browser.close();
