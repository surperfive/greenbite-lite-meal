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
// 默认 tab 是 menu，先切到首页再等 stage（切页动画期间 opacity=0）
await page.click('#nav-tab-home');
await page.waitForFunction(() => {
  const s = document.getElementById('app-page-stage');
  return s && getComputedStyle(s).opacity === '1';
}, { timeout: 30000 });
await page.waitForTimeout(1200);
const info = await page.evaluate(() => {
  const imgs = [...document.querySelectorAll('div')].filter(d => typeof d.className === 'string' && d.className.includes('aspect-[3/2]'));
  const out = [];
  for (const el of imgs.slice(0, 2)) {
    const card = el.parentElement;
    const r = el.getBoundingClientRect();
    const cr = card.getBoundingClientRect();
    out.push({ img: { w: +r.width.toFixed(1), h: +r.height.toFixed(1) }, card: { w: +cr.width.toFixed(1), h: +cr.height.toFixed(1) } });
  }
  return out;
});
console.log(JSON.stringify(info));
await browser.close();
