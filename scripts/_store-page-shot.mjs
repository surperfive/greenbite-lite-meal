/**
 * 「选择门店」页（原弹窗）验证：进页 → 切店 → 返回。
 *
 * 用 clip 截图（元素级 screenshot 在 chrome channel 下对透明容器会出空白）。
 * 用法：BASE_URL=http://localhost:5180 node scripts/_store-page-shot.mjs
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';

const OUT = 'scripts/_shots';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));

const shellClip = async () => {
  const r = await page.evaluate(() => {
    const stage = document.getElementById('app-page-stage');
    const shell = stage.parentElement;
    const b = shell.getBoundingClientRect();
    return { x: b.x, y: b.y, width: b.width, height: b.height };
  });
  return r;
};
const shot = async (name) => {
  const clip = await shellClip();
  await page.screenshot({ path: `${OUT}/${name}.png`, clip });
  console.log('shot:', name, Math.round(clip.width), Math.round(clip.height));
};

await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.waitForTimeout(800);

// 记录进入前的门店名
const storeBefore = await page.locator('[title="点击切换门店"] span').first().textContent();
console.log('当前门店(进入前):', storeBefore);

// 1) 打开门店页
await page.click('[title="点击切换门店"]');
await page.waitForSelector('[data-store-page="true"]', { timeout: 5000 });
await page.waitForTimeout(120);
await shot('store-1-slide-in'); // 滑入中途（验证是从右进，不是淡入）
await page.waitForTimeout(500);
await shot('store-2-open');

// 2) 切换第二家门店 → 应自动返回菜单页
const target = await page.locator('[data-store-page="true"] button').filter({ hasText: '陆家嘴国金店' }).first().textContent();
console.log('待切换门店:', target?.replace(/\s+/g, ' ').slice(0, 20));
await page.locator('[data-store-page="true"] button').filter({ hasText: '陆家嘴国金店' }).first().click();
await page.waitForSelector('[data-store-page="true"]', { state: 'detached', timeout: 5000 });
await page.waitForTimeout(700);
await shot('store-3-after-switch');
const storeAfter = await page.locator('[title="点击切换门店"] span').first().textContent();
console.log('当前门店(切换后):', storeAfter);

// 3) 再进一次，用返回箭头退出（不换店）
await page.click('[title="点击切换门店"]');
await page.waitForSelector('[data-store-page="true"]', { timeout: 5000 });
await page.waitForTimeout(650);
const selectedInPage = await page
  .locator('[data-store-page="true"] button.bg-slate-900 h4')
  .first()
  .textContent();
console.log('页内高亮门店:', selectedInPage);
await page.click('[data-store-page="true"] button[aria-label="返回"]');
await page.waitForTimeout(110);
await shot('store-4-slide-out'); // 退出中途（验证是往右滑出）
await page.waitForSelector('[data-store-page="true"]', { state: 'detached', timeout: 5000 });
await page.waitForTimeout(650);
const storeAfterBack = await page.locator('[title="点击切换门店"] span').first().textContent();
console.log('当前门店(返回后):', storeAfterBack);

// 4) 非点餐页的入口（HeaderBar 上的门店胶囊，订单页）
await page.click('#nav-tab-orders');
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 15000 }).catch(() => {});
await page.waitForTimeout(700);
const headerStoreBtn = page.locator('header button, button').filter({ hasText: '陆家嘴国金店' }).first();
await headerStoreBtn.click();
await page.waitForSelector('[data-store-page="true"]', { timeout: 5000 });
await page.waitForTimeout(650);
await shot('store-5-from-orders');
const coversNav = await page.evaluate(() => {
  const p = document.querySelector('[data-store-page="true"]');
  const nav = document.querySelector('#nav-tab-orders')?.closest('nav, div');
  if (!p) return 'no-page';
  const pr = p.getBoundingClientRect();
  return { pageTop: Math.round(pr.top), pageBottom: Math.round(pr.bottom), pageW: Math.round(pr.width) };
});
console.log('页面覆盖范围:', coversNav);
await page.click('[data-store-page="true"] button[aria-label="返回"]');
await page.waitForSelector('[data-store-page="true"]', { state: 'detached', timeout: 5000 });

// 5) 弹窗残留检查：旧 StoreModal 是 fixed 全屏遮罩，若还在会铺满视口
const legacy = await page.locator('.fixed.inset-0.z-50').count();
console.log('旧弹窗残留节点:', legacy);

await browser.close();
