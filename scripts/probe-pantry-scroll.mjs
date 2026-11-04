/**
 * 量「十连抽」动画期间：滚动容器位置 + 食材库网格首行在屏幕上的 y。
 * 用于确认 scrollPantryIntoView 是否真的把网格抬到了目标位置、以及有没有被弹回去。
 *
 * 用法：node scripts/probe-pantry-scroll.mjs
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { BASE } from './_base.mjs';

const OUT = 'probe-out/pantry-scroll';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();

await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(600);
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === '跳过');
  btn?.click();
});
await page.waitForTimeout(900);
await page.click('#nav-tab-gacha');
await page.waitForTimeout(1500);

const probe = () =>
  page.evaluate(() => {
    const grid = document.querySelector('#unified-pantry-big-card .grid');
    const first = grid?.firstElementChild;
    if (!first) return null;
    let scroller = first.parentElement;
    while (scroller && scroller !== document.body) {
      const oy = getComputedStyle(scroller).overflowY;
      if ((oy === 'auto' || oy === 'scroll') && scroller.scrollHeight > scroller.clientHeight) break;
      scroller = scroller.parentElement;
    }
    const sr = scroller?.getBoundingClientRect();
    return {
      scrollerTop: sr ? Math.round(sr.top) : null,
      scrollTop: scroller ? Math.round(scroller.scrollTop) : null,
      scrollMax: scroller ? Math.round(scroller.scrollHeight - scroller.clientHeight) : null,
      firstRowY: Math.round(first.getBoundingClientRect().top),
      cardCount: grid.children.length
    };
  });

console.log('点击前:', JSON.stringify(await probe()));

await page.click('#btn-gacha-ten');

// 覆盖层在 +2000ms 亮起并触发滚动，之后每 400ms 采一次
for (const t of [2200, 2600, 3000, 3400, 4000, 4600, 5200]) {
  await page.waitForTimeout(t === 2200 ? 2200 : 400);
  console.log(`+${t}ms:`, JSON.stringify(await probe()));
}

await page.screenshot({ path: `${OUT}/final.png` });
await browser.close();
console.log(`\n输出目录：${OUT}`);
