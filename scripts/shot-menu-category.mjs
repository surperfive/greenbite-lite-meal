/**
 * 点餐页左侧分类栏截图 + 几何实测（看「全部热卖 HOT」上标是否被截断 / 是否溢出）。
 *   用法：node scripts/shot-menu-category.mjs [壳宽，默认 390]
 * 产物：outputs/menu-category/rail-{W}.png（整条栏）/ cat-first-{W}.png（首个 tab 放大）
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const W = Number(process.argv[2] || 390);
const OUT = 'outputs/menu-category';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage({ viewport: { width: W, height: 844 }, deviceScaleFactor: 2 });
await page.goto('http://127.0.0.1:5173/', { waitUntil: 'commit' });
/** ⚠️ 顺序不能反：品牌过场是全屏不透明层，盖着的时候 `#nav-tab-menu` 的
 *  `visible` 判定永远是 false（元素在 DOM 里、但被盖住），先等它就会白等 25s 超时。
 *  所以先按掉过场，再等底栏可见。 */
for (let i = 0; i < 10; i++) {
  if ((await page.locator('#app-loading-screen').count()) === 0) break;
  await page.evaluate(() => document.getElementById('app-loading-screen')?.click());
  await page.waitForTimeout(400);
}
await page.waitForSelector('#nav-tab-menu', { state: 'visible', timeout: 25000 });
await page.evaluate(() => document.fonts.ready);

// 进点餐页（品牌过场会重播，轮流点 tab + 按遮罩）
let ok = false;
for (let i = 0; i < 8; i++) {
  await page.evaluate(() => document.querySelector('#nav-tab-menu')?.click());
  await page.waitForTimeout(700);
  if ((await page.locator('#app-loading-screen').count()) > 0) {
    await page.evaluate(() => document.getElementById('app-loading-screen')?.click());
    await page.waitForTimeout(400);
  }
  if (await page.evaluate(() => !!document.querySelector('[data-cat-id="all"]'))) { ok = true; break; }
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(1500);
}
if (!ok) {
  await page.screenshot({ path: `${OUT}/debug.png` });
  console.log('category rail not found');
  await browser.close();
  process.exit(1);
}
await page.waitForTimeout(500);

const info = await page.evaluate(() => {
  const btn = document.querySelector('[data-cat-id="all"]');
  const rail = btn.parentElement;
  const name = btn.querySelector('span');
  const hot = [...btn.querySelectorAll('span')].find((s) => s.textContent === 'HOT');
  const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { x: +b.x.toFixed(1), y: +b.y.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1), right: +b.right.toFixed(1) }; };
  return {
    rail: r(rail),
    btn: r(btn),
    name: { ...r(name), text: name?.textContent, scrollW: name?.scrollWidth, clientW: name?.clientWidth, truncated: name ? name.scrollWidth > name.clientWidth + 0.5 : null, font: name && getComputedStyle(name).fontSize },
    hot: { ...r(hot), font: hot && getComputedStyle(hot).fontSize, color: hot && getComputedStyle(hot).color },
    gapNameToHot: name && hot ? +(hot.getBoundingClientRect().left - name.getBoundingClientRect().right).toFixed(1) : null,
    overflowRight: hot ? +(hot.getBoundingClientRect().right - btn.getBoundingClientRect().right).toFixed(1) : null,
  };
});
console.log(JSON.stringify(info, null, 1));

const first = await page.$('[data-cat-id="all"]');
if (first) {
  const box = await first.boundingBox();
  await page.screenshot({ path: `${OUT}/cat-first-${W}.png`, clip: { x: Math.max(0, box.x - 2), y: Math.max(0, box.y - 6), width: box.width + 8, height: box.height + 12 } });
  // 整条分类栏（看 6 个分类的垂直节奏是否被这次改动带歪）
  await page.screenshot({ path: `${OUT}/rail-${W}.png`, clip: { x: 0, y: box.y - 8, width: 132, height: Math.min(400, 844 - box.y) } });
}
await browser.close();
