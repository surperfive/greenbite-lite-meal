/** 抽卡页整屏：未全选 / 全选 两态，看「全选」胶囊在页面里的观感 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';
const OUT = 'scripts/_shots';
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.waitForTimeout(600);
await page.click('#nav-tab-gacha');
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 15000 }).catch(() => {});
await page.waitForSelector('#btn-category-select-all-pill', { state: 'visible', timeout: 15000 });
await page.waitForTimeout(1000);
await page.evaluate(() => {
  document.getElementById('btn-category-select-all-pill')?.scrollIntoView({ block: 'center' });
});
await page.waitForTimeout(700);
const clip = await page.evaluate(() => {
  const stage = document.getElementById('app-page-stage');
  const b = stage.parentElement.getBoundingClientRect();
  return { x: b.x, y: b.y, width: b.width, height: b.height };
});
await page.screenshot({ path: `${OUT}/gacha-all-none.png`, clip });
await page.click('#btn-category-select-all-pill');
await page.waitForTimeout(800);
await page.screenshot({ path: `${OUT}/gacha-all-full.png`, clip });
console.log('ok');
await browser.close();
