import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
import fs from 'node:fs';

const tag = process.argv[2] || 'x';
const OUT = `outputs/dish-thumb/${tag}`;
fs.mkdirSync(OUT, { recursive: true });

const TARGETS = ['牛油果鸡胸沙拉', '日式照烧鸡肉锅', '希腊酸奶杯'];

const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 4 });
await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
const page = await ctx.newPage();
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#nav-tab-menu', { timeout: 60000 });
for (let i = 0; i < 25; i++) {
  if (!(await page.locator('[aria-label*="页面加载中"]').count())) break;
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => x.textContent?.trim().startsWith('跳过'));
    b?.click();
  });
  await page.waitForTimeout(400);
}
await page.waitForTimeout(700);

// 拿 img 的真实位移/缩放，反推内容盒在 100×100 容器里的位置
const geom = await page.evaluate((names) => {
  const cs = (el) => getComputedStyle(el).transform;
  const parse = (t) => {
    if (!t || t === 'none') return { tx: 0, ty: 0, s: 1 };
    const m = t.match(/matrix\(([^)]+)\)/);
    if (m) {
      const p = m[1].split(',').map(Number);
      return { tx: p[4], ty: p[5], s: p[0] };
    }
    return { tx: 0, ty: 0, s: 1 };
  };
  return names.map((n) => {
    const card = [...document.querySelectorAll('div[data-dish-thumb="true"]')].find((t) =>
      t.parentElement.textContent.includes(n)
    );
    if (!card) return { name: n, missing: true };
    const img = card.querySelector('img');
    const t = parse(cs(img));
    const r = card.getBoundingClientRect();
    return { name: n, containerW: +r.width.toFixed(1), tx: +t.tx.toFixed(2), ty: +t.ty.toFixed(2), s: +t.s.toFixed(3) };
  });
}, TARGETS);
console.log(JSON.stringify(geom, null, 2));

for (const n of TARGETS) {
  const card = page.locator('div[data-dish-thumb="true"]', { has: page.locator(`img[alt="${n}"]`) }).first();
  if (!(await card.count())) {
    console.log('missing card', n);
    continue;
  }
  await card.scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);
  const b = await card.boundingBox();
  // 外扩一点，看食物越界到卡内的部分
  await page.screenshot({
    path: `${OUT}/${n}.png`,
    clip: { x: b.x - 14, y: b.y - 14, width: b.width + 28, height: b.height + 28 },
  });
}
console.log('→', OUT);
await browser.close();
