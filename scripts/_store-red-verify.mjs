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
await page.waitForTimeout(800);
await page.click('button[title="点击切换门店"]');
await page.waitForSelector('text=选择门店', { timeout: 10000 });
await page.waitForTimeout(600);
// 选中卡几何 + 截图
const info = await page.evaluate(() => {
  const cards = [...document.querySelectorAll('button')].filter(b => b.className.includes('bg-[#FC5294]'));
  return cards.map(c => { const r = c.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; });
});
console.log('选中玫红卡:', JSON.stringify(info));
await page.screenshot({ path: 'scripts/_shots/store-selected-red.png' });
await browser.close();
