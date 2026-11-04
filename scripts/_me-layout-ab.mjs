/** 排版 A/B：三行（旧）vs 两行（新）。旧版用 DOM 还原：把胶囊从第一行移回独立一行。
 *  输出 scripts/_shots/lay-rects.json，供 _me-layout-ab-sheet.py 画行边界参考线。 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';
const OUT = 'scripts/_shots';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 3 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.click('#nav-tab-me');
await page.waitForTimeout(1300);

const clip = await page.evaluate(() => {
  const av = document.querySelector('img[src="/mascot-avatar-hd.svg"]').parentElement.getBoundingClientRect();
  return { x: av.x - 6, y: av.y - 6, width: 300, height: av.height + 12 };
});

/** 取三块元素的包围盒（相对裁切框），按「行」归并 */
const rects = () =>
  page.evaluate((clip) => {
    const R = (el) => {
      const b = el.getBoundingClientRect();
      return { l: b.left - clip.x, r: b.right - clip.x, t: b.top - clip.y, b: b.bottom - clip.y };
    };
    const h1 = document.querySelector('h1');
    const pill = document.querySelector('div.inline-flex');
    const track = [...document.querySelectorAll('div')].find((d) => d.className.includes('h-[10px]'));
    const pts = track.parentElement.querySelector('span.shrink-0');
    const uni = (a, b) => ({ l: Math.min(a.l, b.l), r: Math.max(a.r, b.r), t: Math.min(a.t, b.t), b: Math.max(a.b, b.b) });
    return { h1: R(h1), pill: R(pill), gauge: uni(R(track), R(pts)), sameRow: Math.abs(R(pill).t - R(h1).t) < 8 };
  }, clip);

const after = await rects();
await page.screenshot({ path: `${OUT}/lay-after.png`, clip });

await page.evaluate(() => {
  const h1 = document.querySelector('h1');
  const row1 = h1.parentElement;
  const pill = row1.querySelector('div.inline-flex');
  const row2 = row1.nextElementSibling;
  const wrap = document.createElement('div');
  wrap.className = 'mt-1.5 flex items-center';
  wrap.appendChild(pill);
  row1.parentElement.insertBefore(wrap, row2);
});
await page.waitForTimeout(300);
const before = await rects();
await page.screenshot({ path: `${OUT}/lay-before.png`, clip });

fs.writeFileSync(`${OUT}/lay-rects.json`, JSON.stringify({ before, after, clip }, null, 2));
console.log('before', JSON.stringify(before));
console.log('after ', JSON.stringify(after));
await browser.close();
