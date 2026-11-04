/** 抽卡页页头：删图标块 + 币左移后的构图检查。 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';
fs.mkdirSync('scripts/_shots', { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#nav-tab-gacha', { timeout: 20000 });
await page.waitForTimeout(600);
await page.click('#nav-tab-gacha');
await page.waitForSelector('#unified-pantry-big-card', { timeout: 15000 });
// ⚠️ 抽卡页有整页 opacity 进场动画，等短了会截到半透明（黑胶囊被拍成墨绿）
await page.waitForTimeout(2600);

const geo = await page.evaluate(() => {
  const h = document.querySelector('#gacha-page-root header');
  const R = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { x: +b.x.toFixed(1), y: +b.y.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1), r: +b.right.toFixed(1) }; };
  const token = document.getElementById('btn-header-tokens');
  const info = document.getElementById('btn-header-info');
  const title = h.querySelector('h1');
  const sub = h.querySelector('p');
  const tag = h.querySelector('h1 + span') || h.querySelectorAll('span').length;
  return {
    header: R(h),
    tokens: R(token),
    info: R(info),
    title: R(title),
    sub: R(sub),
    subText: sub?.textContent.trim(),
    subLines: sub ? Math.round(sub.getBoundingClientRect().height / parseFloat(getComputedStyle(sub).lineHeight || '12')) : null,
    titleOverflow: sub ? sub.scrollWidth > sub.clientWidth + 1 : null,
  };
});
console.log(JSON.stringify(geo, null, 2));
const hb = await page.locator('#gacha-page-root header').boundingBox();
await page.screenshot({ path: 'scripts/_shots/gacha-header.png', clip: { x: 0, y: 0, width: 430, height: hb.height + 20 } });
console.log('errors:', errs.length ? errs : 'none');
await browser.close();
