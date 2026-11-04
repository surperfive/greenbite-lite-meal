/** 点餐页菜品卡「收藏心」：未收藏 = 灰、点击后 = 品牌红。
 *  ⚠️ 用 ElementHandle 而不是 locator：locator 在点击后 aria-label 变了会重新解析到别的卡，
 *     导致「前后对比」截的是两张不同的菜。
 *  ⚠️ 元素级截图在带 transform 的容器里会错位，统一「整页截图 + clip」。 */
import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
import fs from 'node:fs';

const OUT = process.argv[2] || 'outputs/fav-heart';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 3 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.click('#nav-tab-menu');
await page.waitForTimeout(1800);

// 第一颗「未收藏」的心 = 干净的 before 态
const handle = await page.evaluateHandle(() => document.querySelector('[aria-label="加入收藏"]'));
const el = handle.asElement();
if (!el) throw new Error('没找到未收藏的心');

await el.scrollIntoViewIfNeeded();
await page.waitForTimeout(500);

const box = await el.evaluate((node) => {
  let n = node;
  for (let i = 0; i < 8 && n; i += 1) {
    if (n.querySelector && n.querySelector('h4')) break;
    n = n.parentElement;
  }
  const r = (n || node).getBoundingClientRect();
  return { x: r.x + window.scrollX, y: r.y + window.scrollY, w: r.width, h: r.height, name: n?.querySelector('h4')?.textContent };
});
console.log('卡片', box.name, `${Math.round(box.w)}x${Math.round(box.h)}`);

const read = () =>
  el.evaluate((node) => {
    const svg = node.querySelector('svg');
    return {
      label: node.getAttribute('aria-label'),
      color: getComputedStyle(node).color,
      fill: getComputedStyle(svg).fill,
      stroke: getComputedStyle(svg).stroke,
    };
  });

const shot = (name) =>
  page.screenshot({
    path: `${OUT}/${name}.png`,
    clip: { x: box.x - 6, y: box.y - 6, width: box.w + 12, height: box.h + 12 },
  });

await shot('card-before');
console.log('点击前', JSON.stringify(await read()));

await el.click();
await page.mouse.move(5, 5);
await page.waitForTimeout(400);
await shot('card-after');
console.log('点击后', JSON.stringify(await read()));

await browser.close();
