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
await page.waitForTimeout(1200);
const info = await page.evaluate(() => {
  const sec = document.getElementById('home-popular-dishes-section');
  const cards = sec.querySelectorAll('.grid > div');
  const img = sec.querySelector('.aspect-\\[4\\/3\\]');
  const cr = cards[0].getBoundingClientRect();
  const ir = img ? img.getBoundingClientRect() : null;
  return { cards: cards.length, cardH: +cr.height.toFixed(1), imgH: ir ? +ir.height.toFixed(1) : null, imgW: ir ? +ir.width.toFixed(1) : null };
});
console.log(JSON.stringify(info));
// 截两联卡
await page.evaluate(() => {
  document.getElementById('home-popular-dishes-section')?.scrollIntoView({ block: 'start' });
  window.scrollBy(0, -50);
});
await page.waitForTimeout(700);
const r = await page.evaluate(() => {
  const b = document.getElementById('home-popular-dishes-section').getBoundingClientRect();
  return { y: Math.max(0, b.top), h: Math.min(b.height + 40, 932 - Math.max(0, b.top)) };
});
await page.screenshot({ path: 'scripts/_shots/popular-card-short.png', clip: { x: 0, y: r.y, width: 430, height: r.h } });
await browser.close();
