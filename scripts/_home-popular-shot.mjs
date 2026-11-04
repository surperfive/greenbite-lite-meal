/** 首页「人气当季轻食」网格截图（定位用户提到的卡片背景问题） */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';
const OUT = 'scripts/_shots';
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 3 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.waitForTimeout(700);
await page.click('#nav-tab-home');
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 15000 }).catch(() => {});
await page.waitForTimeout(900);
await page.evaluate(() => {
  document.getElementById('home-popular-dishes-section')?.scrollIntoView({ block: 'start' });
});
await page.waitForTimeout(700);
const box = await page.evaluate(() => {
  const el = document.getElementById('home-popular-dishes-section');
  const r = el.getBoundingClientRect();
  return { x: r.x, y: r.y, width: r.width, height: r.height };
});
console.log('section box', box);
await page.screenshot({ path: `${OUT}/home-popular.png`, clip: box });
// 卡片尺寸
const cards = await page.evaluate(() => {
  const sec = document.getElementById('home-popular-dishes-section');
  const g = sec.querySelector('.grid');
  const cs = [...g.children].slice(0, 2).map((c) => {
    const r = c.getBoundingClientRect();
    const img = c.querySelector('img')?.getBoundingClientRect();
    return { card: [Math.round(r.width), Math.round(r.height)], img: img ? [Math.round(img.width), Math.round(img.height)] : null };
  });
  return cs;
});
console.log(JSON.stringify(cards));
await browser.close();
