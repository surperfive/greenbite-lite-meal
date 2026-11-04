/**
 * 状态胶囊里皇冠的尺寸对比：10 / 9 / 8 px（DOM 直接改 class，不改源码）
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';
const OUT = 'scripts/_shots';
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 6 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.waitForTimeout(600);
await page.click('#nav-tab-gacha');
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 15000 }).catch(() => {});
await page.waitForSelector('#btn-header-tokens', { state: 'visible', timeout: 15000 });
await page.waitForTimeout(800);
await page.click('#btn-header-tokens');
await page.waitForTimeout(900);

const clip = await page.evaluate(() => {
  const r = document.getElementById('tokens-status-pill').getBoundingClientRect();
  return { x: r.x - 4, y: r.y - 4, width: 180, height: r.height + 8 };
});
for (const [name, cls] of [['10px', 'h-2.5 w-2.5'], ['9px', 'h-[9px] w-[9px]'], ['8px', 'h-2 w-2']]) {
  await page.evaluate((c) => {
    const svg = document.querySelector('#tokens-status-pill svg');
    svg.setAttribute('class', 'block shrink-0 ' + c + ' text-[#070906]');
  }, cls);
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${OUT}/pill-icon-${name}.png`, clip });
}
await browser.close();
