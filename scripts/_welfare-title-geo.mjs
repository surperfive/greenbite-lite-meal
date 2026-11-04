/** 量 TitleArt 里每个子元素的实际屏幕位置，确认荧光涂鸦右端是否越过卡片右边。 */
import { chromium } from 'playwright';
import { BASE } from './_base.mjs';

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 1 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#nav-tab-home', { timeout: 20000 });
await page.waitForTimeout(700);
await page.click('#nav-tab-home');
await page.waitForSelector('#home-benefit-card', { timeout: 8000 });
await page.waitForTimeout(700);
await page.click('#home-benefit-card');
await page.waitForSelector('#welfare-center-stage', { timeout: 5000 });
await page.waitForTimeout(900);

const r = await page.evaluate(() => {
  const card = document.querySelector('.wf-board').getBoundingClientRect();
  const svg = document.querySelector('.wf-title-group svg');
  const sr = svg.getBoundingClientRect();
  const kids = [...svg.querySelectorAll('rect, path, text')].map((el) => {
    const b = el.getBoundingClientRect();
    return { tag: el.tagName, d: (el.getAttribute('d') || '').slice(0, 26), r: +b.right.toFixed(1), w: +b.width.toFixed(1) };
  }).filter((k) => k.r > 0).sort((a, b) => b.r - a.r).slice(0, 6);
  return {
    card: { x: +card.x.toFixed(1), r: +card.right.toFixed(1) },
    svg: { x: +sr.x.toFixed(1), r: +sr.right.toFixed(1), w: +sr.width.toFixed(1) },
    rightmost: kids,
  };
});
console.log(JSON.stringify(r, null, 2));
await browser.close();
