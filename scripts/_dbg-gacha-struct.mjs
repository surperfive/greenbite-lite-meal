import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 1 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 30000 }).catch(() => {});
await page.waitForFunction(() => {
  const s = document.getElementById('app-page-stage');
  return s && getComputedStyle(s).opacity === '1';
}, { timeout: 30000 });
await page.click('#nav-tab-gacha');
await page.waitForFunction(() => {
  const s = document.getElementById('app-page-stage');
  return s && getComputedStyle(s).opacity === '1';
}, { timeout: 30000 });
await page.waitForTimeout(1500);
// 找页面上所有 ECFDC0 元素并列出几何信息
const info = await page.evaluate(() => {
  const els = [...document.querySelectorAll('*')].filter(e => {
    const cs = getComputedStyle(e);
    return cs.backgroundColor.startsWith('rgb(236, 253, 192)');
  });
  return els.slice(0, 12).map(e => {
    const r = e.getBoundingClientRect();
    return { tag: e.tagName, id: e.id, cls: (e.className||'').toString().slice(0, 60), x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), txt: e.textContent.slice(0, 30) };
  });
});
console.log(JSON.stringify(info, null, 1));
await page.screenshot({ path: 'scripts/_shots/gacha-page.png', fullPage: false });
await browser.close();
