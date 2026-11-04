/** 菜品详情页顶栏：删分享圆钮后的构图检查。 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';
fs.mkdirSync('scripts/_shots', { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.waitForTimeout(1500);

// 点第一张菜品卡进详情
await page.locator('[data-dish-thumb="true"]').first().click();
await page.waitForTimeout(1600);

const geo = await page.evaluate(() => {
  const R = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { x: +b.x.toFixed(1), y: +b.y.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1), r: +b.right.toFixed(1) }; };
  const back = document.querySelector('button[aria-label="返回"]');
  const bar = back?.parentElement;
  const share = document.querySelector('button[title="分享"]');
  return {
    back: R(back),
    bar: R(bar),
    shareExists: !!share,
    rightCluster: R(bar?.lastElementChild),
  };
});
console.log(JSON.stringify(geo, null, 2));
await page.screenshot({ path: 'scripts/_shots/detail-topbar.png', clip: { x: 0, y: 0, width: 430, height: 300 } });
console.log('errors:', errs.length ? errs : 'none');
await browser.close();
