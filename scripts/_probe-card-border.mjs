/** 量首页人气卡描边的计算值（宽度/颜色/圆角），确认 border 真的生效、没被 overflow 裁掉
 *  用法：node scripts/_probe-card-border.mjs */
import { chromium } from 'playwright';

const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage({ viewport: { width: 390, height: 932 }, deviceScaleFactor: 2 });
await page.goto('http://127.0.0.1:5173/', { waitUntil: 'commit' });
await page.waitForSelector('#nav-tab-home', { state: 'visible', timeout: 25000 });
await page.waitForSelector('#app-loading-screen', { state: 'detached', timeout: 25000 }).catch(() => {});
await page.waitForTimeout(1200);

/** 扛 HMR 重载 / 品牌过场：反复点首页 Tab + reload，直到人气卡挂上去 */
for (let i = 0; i < 6; i++) {
  await page.evaluate(() => document.querySelector('#nav-tab-home')?.click());
  await page.waitForTimeout(700);
  if (await page.evaluate(() => !!document.querySelector('#home-popular-dishes-section'))) break;
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(1500);
}

const out = await page.evaluate(() => {
  const grid = document.querySelector('#home-popular-dishes-section .grid');
  return [...grid.children].slice(0, 2).map((c) => {
    const cs = getComputedStyle(c);
    const r = c.getBoundingClientRect();
    return {
      w: +r.width.toFixed(2),
      h: +r.height.toFixed(2),
      border: [cs.borderTopWidth, cs.borderRightWidth, cs.borderBottomWidth, cs.borderLeftWidth].join('/'),
      color: cs.borderTopColor,
      radius: cs.borderTopLeftRadius,
      boxSizing: cs.boxSizing,
      // 边框内沿到内容左沿的距离，应当 = 2px(border) + 内容自身 padding
      innerLeft: +(c.querySelector('h4').getBoundingClientRect().left - r.left).toFixed(2),
    };
  });
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
