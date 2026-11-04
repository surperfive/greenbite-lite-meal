/** 量订单缩略图里 DishCoverArt 的容器 / svg / path 实际几何 */
import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 1 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.waitForTimeout(600);
await page.click('#nav-tab-orders');
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 15000 }).catch(() => {});
await page.waitForTimeout(1000);
const out = await page.evaluate(() => {
  // 找所有含 svg>path 的 DishCoverArt 根节点
  const svgs = [...document.querySelectorAll('svg')].filter((s) => s.querySelector('path[d^="M"]'));
  return svgs.slice(0, 6).map((s) => {
    const root = s.parentElement;
    const rr = root.getBoundingClientRect();
    const sr = s.getBoundingClientRect();
    const path = s.querySelector('path');
    const pb = path.getBBox();
    const cs = getComputedStyle(root);
    return {
      root: { w: +rr.width.toFixed(1), h: +rr.height.toFixed(1) },
      svg: { w: +sr.width.toFixed(1), h: +sr.height.toFixed(1) },
      par: s.getAttribute('preserveAspectRatio'),
      vb: s.getAttribute('viewBox'),
      pathBox: { x: +pb.x.toFixed(1), y: +pb.y.toFixed(1), w: +pb.width.toFixed(1), h: +pb.height.toFixed(1) },
      rootCls: root.className,
      display: cs.display,
    };
  });
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
