import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 30000 }).catch(() => {});
await page.waitForFunction(() => {
  const s = document.getElementById('app-page-stage');
  return s && getComputedStyle(s).opacity === '1';
}, { timeout: 30000 });
await page.click('#nav-tab-home');
await page.waitForFunction(() => {
  const s = document.getElementById('app-page-stage');
  return s && getComputedStyle(s).opacity === '1';
}, { timeout: 30000 });
await page.waitForTimeout(1000);
const info = await page.evaluate(() => {
  const bar = document.getElementById('home-member-bar');
  const br = bar.getBoundingClientRect();
  // 往上找第一个高度 > 200 的兄弟/祖先块，输出其几何与类名
  const out = [];
  let el = bar;
  for (let i = 0; i < 5 && el; i++) {
    el = el.parentElement;
    if (!el) break;
    const r = el.getBoundingClientRect();
    out.push({ lvl: i, cls: (el.className || '').toString().slice(0, 70), top: Math.round(r.top), h: Math.round(r.height) });
  }
  // 身份条上方最近的 img
  const imgs = [...document.querySelectorAll('img')].map(i => { const r = i.getBoundingClientRect(); return { src: i.src.split('/').pop(), top: Math.round(r.top), h: Math.round(r.height) }; }).filter(i => i.top < br.top && i.h > 100);
  return { bar: { top: Math.round(br.top), h: Math.round(br.height), center: Math.round(br.top + br.height / 2) }, ancestors: out, imgsAbove: imgs.slice(0, 3) };
});
console.log(JSON.stringify(info, null, 1));
await browser.close();
