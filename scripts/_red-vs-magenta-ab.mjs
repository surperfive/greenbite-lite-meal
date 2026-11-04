/** 同页 A/B：点餐列表「旧红 #E60012」vs「新玫红 #FC259B」。
 *
 *  做法：先按现状截图（新色），再用 JS 把**计算色等于 #FC259B 的元素**的行内
 *  color / backgroundColor / fill / stroke 改回 #E60012，截第二张。
 *  同一次渲染、同一帧布局，只差颜色 —— 比拿旧截图比可信。
 *  ⚠️ 截取区域别用 `[data-dish-thumb="true"]` 的 bbox：那是**菜品图元素**，
 *     只框住圆盘插画，价格和收藏心全在框外（第一次就截成了两张圆盘）。
 */
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
await page.click('#nav-tab-menu', { timeout: 4000 }).catch(() => {});
await page.waitForTimeout(1800);

// 以第一张菜卡的价格文本为锚，取「卡右半 + 上下两张卡」
const clip = await page.evaluate(() => {
  const price = [...document.querySelectorAll('span')].find(
    (e) => getComputedStyle(e).color === 'rgb(252, 37, 155)' && e.textContent.trim().startsWith('¥')
  );
  const r = price.getBoundingClientRect();
  const cards = [...document.querySelectorAll('[data-dish-thumb="true"]')];
  const second = cards[1] ? cards[1].getBoundingClientRect() : r;
  return { x: r.x - 210, y: r.y - 96, width: 236, height: second.bottom - (r.y - 96) + 12 };
});
await page.screenshot({ path: `${OUT}/ab-new-magenta.png`, clip });

const n = await page.evaluate(() => {
  const OLD = 'rgb(230, 0, 18)';
  const NEW = 'rgb(252, 37, 155)';
  let c = 0;
  for (const el of document.querySelectorAll('*')) {
    const cs = getComputedStyle(el);
    let hit = false;
    for (const prop of ['color', 'backgroundColor', 'fill', 'stroke']) {
      if (cs[prop] === NEW) { el.style[prop] = OLD; hit = true; }
    }
    if (hit) c++;
  }
  return c;
});
console.log('改回旧红的元素数:', n);
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/ab-old-red.png`, clip });
console.log('ok');
await browser.close();
