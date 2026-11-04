/** 皇冠徽章 12 / 13 / 14 三档（头像已 34） */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';
const OUT = 'scripts/_shots';
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
for (const sz of [12, 13, 14]) {
  const page = await browser.newPage({ viewport: { width: 410, height: 900 }, deviceScaleFactor: 8 });
  await page.goto(BASE, { waitUntil: 'commit' });
  await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 25000 }).catch(()=>{});
  await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 25000 }).catch(()=>{});
  await page.waitForTimeout(400);
  await page.click('#nav-tab-home');
  await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(()=>{});
  await page.waitForTimeout(1600);
  await page.evaluate((s) => {
    const bar = document.getElementById('home-member-bar');
    const svg = bar.querySelector('span.relative svg');
    svg.style.height = s + 'px'; svg.style.width = s + 'px';
  }, sz);
  await page.waitForTimeout(300);
  const box = await page.evaluate(() => {
    const bar = document.getElementById('home-member-bar');
    const av = bar.querySelector('span.relative');
    const b = av.getBoundingClientRect();
    return { x: Math.max(0,b.x-4), y: Math.max(0,b.y-4), width: b.width+10, height: b.height+10 };
  });
  await page.screenshot({ path: `${OUT}/badge-${sz}.png`, clip: box });
  await page.close();
}
await browser.close();
console.log('ok');
