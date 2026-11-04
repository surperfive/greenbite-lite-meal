/**
 * 校验「全站红 = #FC5294」：
 *   1) 逐个 Tab / 弹窗 / 详情页，收集所有「带红感的 computed color / backgroundColor」
 *   2) 断言没有任何 rgb(184,60,108)（旧的深玫红 #B83C6C）残留
 *   3) 输出每处红元素的 rgb + 文本，便于人工核对
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const TAG = process.argv[2] || 'v1';
const OUT = 'outputs/rose-verify';
mkdirSync(OUT, { recursive: true });

const DEEP = 'rgb(184, 60, 108)';
const BRIGHT = 'rgb(252, 82, 148)';

const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });

const collect = () =>
  page.evaluate(
    ({ DEEP, BRIGHT }) => {
      const out = { bright: [], deep: [], otherRed: [] };
      const isReddish = (c) => {
        const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (!m) return false;
        const [r, g, b] = [+m[1], +m[2], +m[3]];
        return r > 120 && r - g > 45 && b > g;
      };
      for (const el of document.querySelectorAll('*')) {
        const r = el.getBoundingClientRect();
        if (r.width < 1 || r.height < 1) continue;
        const cs = getComputedStyle(el);
        const txt = (el.textContent || '').trim().slice(0, 22);
        for (const prop of ['color', 'backgroundColor', 'fill', 'stroke']) {
          const v = prop === 'fill' || prop === 'stroke' ? cs[prop] : cs[prop];
          if (!v || v === 'none' || v === 'rgba(0, 0, 0, 0)') continue;
          if (v === DEEP) {
            out.deep.push({ prop, txt, cls: el.className?.toString?.().slice(0, 60) });
          } else if (v === BRIGHT) {
            out.bright.push({ prop, txt });
          } else if (isReddish(v)) {
            out.otherRed.push({ prop, v, txt });
          }
        }
      }
      return out;
    },
    { DEEP, BRIGHT }
  );

const report = {};

async function shot(name) {
  await page.screenshot({ path: `${OUT}/${TAG}-${name}.png` });
}

async function tab(name) {
  for (let i = 0; i < 6; i++) {
    await page.evaluate((n) => document.querySelector(`#nav-tab-${n}`)?.click(), name);
    await page.waitForTimeout(700);
    const ok = await page.evaluate(
      (n) => document.querySelector(`#nav-tab-${n}`)?.getAttribute('aria-current') === 'page',
      name
    );
    if (ok) break;
  }
  await page.waitForTimeout(600);
}

await page.goto('http://127.0.0.1:5173/', { waitUntil: 'commit' });
await page.waitForSelector('#app-loading-screen', { state: 'detached', timeout: 25000 }).catch(() => {});
await page.waitForTimeout(900);
const skip = page.getByText('跳过');
if (await skip.count()) await skip.first().click().catch(() => {});
await page.waitForTimeout(1800);
await page.evaluate(() => document.fonts.ready);

for (const t of ['home', 'menu', 'gacha', 'orders', 'me']) {
  await tab(t);
  report[t] = await collect();
  await shot(t);
}

// 详情页：从点餐页第一个「+」进入
await tab('menu');
await page.waitForTimeout(500);
const plus = page.locator('button[aria-label^="加"]').first();
if (await plus.count()) {
  await plus.click().catch(() => {});
} else {
  await page.locator('#menu-header-banner').click().catch(() => {});
}
await page.waitForTimeout(1200);
report.detail = await collect();
await shot('detail');

// 购物车：订单页「再来一单」是唯一进 CartPage 的入口（activeTab==='cart'）
await tab('orders');
await page.waitForTimeout(600);
const again = page.getByText('再来一单').first();
if (await again.count()) {
  await again.click().catch(() => {});
  await page.waitForTimeout(1300);
  report.cart = await collect();
  await shot('cart');
}

// 搜索弹窗
await tab('menu');
await page.waitForTimeout(500);
const searchBox = page.locator('#menu-header-banner').locator('..').getByText(/搜索轻食/).first();
if (await searchBox.count()) {
  await searchBox.click().catch(() => {});
  await page.waitForTimeout(900);
  const input = page.locator('input').first();
  if (await input.count()) await input.fill('鸡').catch(() => {});
  await page.waitForTimeout(1300);
  report.search = await collect();
  await shot('search');
}

let deepTotal = 0;
console.log('\n=== 深玫红 rgb(184,60,108) 残留 ===');
for (const [k, v] of Object.entries(report)) {
  if (!v) continue;
  deepTotal += v.deep.length;
  if (v.deep.length) {
    console.log(k, v.deep.length);
    v.deep.slice(0, 5).forEach((d) => console.log('   ', d.prop, d.txt, '|', d.cls));
  }
}
console.log('总计', deepTotal);

console.log('\n=== 亮红 rgb(252,82,148) 出现次数（按页面）===');
for (const [k, v] of Object.entries(report)) {
  if (!v) continue;
  const text = v.bright.filter((x) => x.prop === 'color').length;
  const bg = v.bright.filter((x) => x.prop === 'backgroundColor').length;
  const fs = v.bright.filter((x) => x.prop === 'fill' || x.prop === 'stroke').length;
  console.log(`${k.padEnd(7)} 文字 ${String(text).padStart(2)} | 底色 ${String(bg).padStart(2)} | 图标 ${fs}`);
}

console.log('\n=== 其它红/粉色值（需人工判断是否属于品牌粉/菜品色）===');
const otherSet = new Map();
for (const [k, v] of Object.entries(report)) {
  if (!v) continue;
  for (const o of v.otherRed) {
    const key = o.v + ' @' + k;
    if (!otherSet.has(key)) otherSet.set(key, o.txt);
  }
}
for (const [k, t] of otherSet) console.log(' ', k, '|', t);

writeFileSync(`${OUT}/${TAG}.json`, JSON.stringify(report, null, 1));
await browser.close();
