import { chromium } from 'playwright';
import { BASE } from './_base.mjs';

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

const info = await page.evaluate(() => {
  const hot = [...document.querySelectorAll('span')].find((s) => s.textContent?.trim() === 'HOT');
  const name = [...document.querySelectorAll('span')].find((s) => s.textContent?.trim() === '全部热卖');
  const col = hot?.parentElement;
  const btn = col?.parentElement;
  const box = (el) => {
    const r = el.getBoundingClientRect();
    return { x: +r.x.toFixed(2), y: +r.y.toFixed(2), w: +r.width.toFixed(2), h: +r.height.toFixed(2) };
  };
  // 文本实际起点（range）
  const textStart = (el) => {
    const rg = document.createRange();
    rg.selectNodeContents(el);
    const r = rg.getBoundingClientRect();
    return { x: +r.x.toFixed(2), right: +r.right.toFixed(2), w: +r.width.toFixed(2) };
  };
  return {
    col: col && { tag: col.tagName, cls: col.className, ...box(col) },
    btn: btn && { tag: btn.tagName, ...box(btn) },
    name: name && { ...box(name), text: textStart(name), align: getComputedStyle(name).textAlign },
    hot: hot && { ...box(hot), text: textStart(hot), align: getComputedStyle(hot).textAlign, ml: getComputedStyle(hot).marginLeft },
  };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
