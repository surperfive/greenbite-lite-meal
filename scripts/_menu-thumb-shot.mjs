import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 30000 }).catch(() => {});
async function stageReady() {
  await page.waitForFunction(() => {
    const s = document.getElementById('app-page-stage');
    return s && getComputedStyle(s).opacity === '1';
  }, { timeout: 30000 });
}
await stageReady();
await page.waitForTimeout(2500);
// 找到前两张菜卡的缩略图容器
const boxes = await page.evaluate(() => {
  const arts = [...document.querySelectorAll('#menu-dish-list [class*="DishCoverArt"], #menu-dish-list svg')].slice(0, 2);
  const thumbs = [...document.querySelectorAll('[data-dish-thumb="true"]')].slice(0, 4);
  return thumbs.map(c => { const r = c.getBoundingClientRect(); return { t: +r.top.toFixed(0), l: +r.left.toFixed(0), w: +r.width.toFixed(0), h: +r.height.toFixed(0) }; });
});
console.log(JSON.stringify(boxes));
if (boxes[0]) {
  const b = boxes[0];
  await page.screenshot({ path: 'scripts/_shots/menu-cards.png', clip: { x: Math.max(0,b.l-6), y: Math.max(0,b.t-6), width: Math.min(430,b.w+12), height: Math.min(932-b.t, b.h*2+20) } });
}
await browser.close();
