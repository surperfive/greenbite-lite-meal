/** 量分类 tab：灰底轨道 vs 选中胶囊的四边，检查 border-2 是否把它顶出容器 */
import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 } });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.waitForTimeout(600);
await page.click('#nav-tab-gacha');
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 15000 }).catch(() => {});
await page.waitForSelector('#btn-category-select-all-pill', { state: 'visible', timeout: 15000 });
await page.waitForTimeout(900);
for (const label of ['全部', '蛋白', '蔬底']) {
  await page.evaluate((t) => {
    [...document.querySelectorAll('button')].filter((b) => b.textContent?.trim() === t)[0]?.click();
  }, label);
  await page.waitForTimeout(500);
  const m = await page.evaluate((t) => {
    const btn = [...document.querySelectorAll('button')].filter((b) => b.textContent?.trim() === t)[0];
    const track = btn.parentElement;
    const b = btn.getBoundingClientRect();
    const r = track.getBoundingClientRect();
    return {
      track: { l: +r.left.toFixed(1), r: +r.right.toFixed(1), w: +r.width.toFixed(1) },
      pill: { l: +b.left.toFixed(1), r: +b.right.toFixed(1), w: +b.width.toFixed(1) },
      leftGap: +(b.left - r.left).toFixed(1),
      rightGap: +(r.right - b.right).toFixed(1),
      overflow: b.right > r.right || b.left < r.left,
    };
  }, label);
  console.log(label, JSON.stringify(m));
}
await browser.close();
