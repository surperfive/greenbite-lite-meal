/** 福利中心弹窗：去插画后的整卡截图 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';
const OUT = 'scripts/_shots';
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 410, height: 900 }, deviceScaleFactor: 3 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 25000 }).catch(()=>{});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 25000 }).catch(()=>{});
await page.waitForTimeout(400);
await page.click('#nav-tab-home');
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(()=>{});
await page.waitForTimeout(1600);
// 点福利中心入口卡
await page.click('#home-benefit-card');
console.log('点福利卡 ok');
await page.waitForTimeout(1500);
const info = await page.evaluate(() => {
  const h3 = [...document.querySelectorAll('h3')].find(h => (h.textContent||'').trim() === '福利中心');
  if (!h3) return null;
  const card = h3.closest('div[id]') || h3.closest('[role=dialog]');
  const hasVideo = !!document.querySelector('video');
  const sub = [...document.querySelectorAll('p')].find(p => (p.textContent||'').includes('恭喜获得'));
  const firstCoupon = [...document.querySelectorAll('div')].find(d => (d.textContent||'').includes('全品类无门槛立减券'));
  const b = card?.getBoundingClientRect();
  return {
    hasVideo,
    cardBox: b ? `${b.width.toFixed(0)}x${b.height.toFixed(0)}` : null,
    subBottom: sub ? +sub.getBoundingClientRect().bottom.toFixed(1) : null,
    couponTop: firstCoupon ? +firstCoupon.getBoundingClientRect().top.toFixed(1) : null,
    gap: (sub && firstCoupon) ? +(firstCoupon.getBoundingClientRect().top - sub.getBoundingClientRect().bottom).toFixed(1) : null,
  };
});
console.log(JSON.stringify(info, null, 2));
const box = await page.evaluate(() => {
  const h3 = [...document.querySelectorAll('h3')].find(h => (h.textContent||'').trim() === '福利中心');
  const card = h3.closest('div[id]') || h3.closest('[role=dialog]');
  const b = card.getBoundingClientRect();
  return { x: Math.max(0,b.x-16), y: Math.max(0,b.y-16), width: Math.min(410-b.x+16, b.width+32), height: Math.min(900-b.y+16, b.height+32) };
});
await page.screenshot({ path: `${OUT}/welfare-no-visual.png`, clip: box });
await browser.close();
