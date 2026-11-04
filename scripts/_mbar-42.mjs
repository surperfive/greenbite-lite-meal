/** 补一档 42px：头像32 / py4 / r20 / mt21（对齐 2026-10-30 那次 +6 的幅度） */
import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 410, height: 900 }, deviceScaleFactor: 4 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 25000 }).catch(()=>{});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 25000 }).catch(()=>{});
await page.waitForTimeout(400);
await page.click('#nav-tab-home');
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(()=>{});
await page.waitForTimeout(1600);
await page.evaluate(() => {
  const bar = document.getElementById('home-member-bar');
  bar.style.minHeight = '0px';
  bar.style.paddingTop = '4px';
  bar.style.paddingBottom = '4px';
  bar.style.borderRadius = '20px';
  const img = bar.querySelector('img');
  img.style.height = '32px'; img.style.width = '32px';
  let wrap = bar.parentElement;
  while (wrap && !(wrap.className||'').toString().includes('-mt-')) wrap = wrap.parentElement;
  if (wrap) wrap.style.marginTop = '-21px';
});
await page.waitForTimeout(450);
const m = await page.evaluate(() => {
  const bar = document.getElementById('home-member-bar');
  const cs = getComputedStyle(bar);
  return { h: +bar.getBoundingClientRect().height.toFixed(2), pt: cs.paddingTop, r: cs.borderRadius };
});
console.log('E 42px', JSON.stringify(m));
const box = await page.evaluate(() => {
  const b = document.getElementById('home-member-bar').getBoundingClientRect();
  return { x: Math.max(0,b.x-12), y: Math.max(0,b.y-22), width: Math.min(410-b.x+12,b.width+24), height: b.height+44 };
});
await page.screenshot({ path: 'scripts/_shots/mbar-E.png', clip: box });
await browser.close();
