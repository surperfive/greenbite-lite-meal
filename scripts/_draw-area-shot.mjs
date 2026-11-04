/**
 * 抽卡按钮区 + 9折限时徽章 4× 局部：看「抽卡币皇冠」和徽章上的装饰皇冠是否同一形状
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';
const OUT = 'scripts/_shots';
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 4 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.waitForTimeout(600);
await page.click('#nav-tab-gacha');
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 15000 }).catch(() => {});
await page.waitForSelector('#btn-single', { state: 'visible', timeout: 15000 });
await page.waitForTimeout(1000);
const r = await page.evaluate(() => {
  const a = document.getElementById('btn-single').getBoundingClientRect();
  const b = document.getElementById('badge-discount').getBoundingClientRect();
  const x = Math.min(a.x, b.x) - 8, y = Math.min(a.y, b.y) - 8;
  return { x, y, width: Math.max(a.right, b.right) - x + 8, height: Math.max(a.bottom, b.bottom) - y + 8 };
});
await page.screenshot({ path: `${OUT}/draw-area.png`, clip: r });
console.log(JSON.stringify(r));
await browser.close();
