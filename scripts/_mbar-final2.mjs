/** 最终验证：42 高 + 两态同高 + 皇冠 13 + 骑缝居中 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';
const OUT = 'scripts/_shots';
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 410, height: 900 }, deviceScaleFactor: 4 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 25000 }).catch(()=>{});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 25000 }).catch(()=>{});
await page.waitForTimeout(400);
await page.click('#nav-tab-home');
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(()=>{});
await page.waitForTimeout(1600);

const measure = () => page.evaluate(() => {
  const bar = document.getElementById('home-member-bar');
  const cs = getComputedStyle(bar);
  const b = bar.getBoundingClientRect();
  const hero = document.querySelector('img[src*="hero-poster"]');
  const hb = hero?.getBoundingClientRect();
  const img = bar.querySelector('img');
  const svg = bar.querySelector('span.relative svg');
  const av = bar.querySelector('span.relative');
  return {
    barH: +b.height.toFixed(2),
    seamDelta: hb ? +((b.top + b.height / 2) - hb.bottom).toFixed(2) : null,
    pt: cs.paddingTop, pb: cs.paddingBottom, radius: cs.borderRadius, minH: cs.minHeight,
    img: img ? `${img.getBoundingClientRect().width.toFixed(1)}x${img.getBoundingClientRect().height.toFixed(1)}` : null,
    avatarBox: av ? +av.getBoundingClientRect().height.toFixed(2) : null,
    badge: svg ? `${svg.getBoundingClientRect().width.toFixed(1)}x${svg.getBoundingClientRect().height.toFixed(1)}` : null,
    text: (bar.textContent || '').trim().slice(0, 40),
  };
});

console.log('已登录', JSON.stringify(await measure()));

// 退出登录，看未登录态高度
await page.click('#nav-tab-me');
await page.waitForTimeout(1200);
const out = await page.evaluate(() => {
  const el = [...document.querySelectorAll('button')].find(d => (d.textContent||'').trim().includes('退出登录'));
  if (el) { el.click(); return true; }
  return false;
});
console.log('点退出登录:', out);
await page.waitForTimeout(1000);
await page.click('#nav-tab-home');
await page.waitForTimeout(1400);
console.log('未登录', JSON.stringify(await measure()));

const clip = await page.evaluate(() => {
  const b = document.getElementById('home-member-bar').getBoundingClientRect();
  return { x: Math.max(0,b.x-12), y: Math.max(0,b.y-26), width: Math.min(410-b.x+12,b.width+24), height: b.height+52 };
});
await page.screenshot({ path: `${OUT}/mbar-final-loggedout.png`, clip });
await browser.close();
