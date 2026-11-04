/**
 * 真实弹窗里徽章局部（4x）+ 黑边 36 方向厚度测量
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
await page.waitForSelector('#btn-header-tokens', { state: 'visible', timeout: 15000 });
await page.waitForTimeout(800);
await page.click('#btn-header-tokens');
await page.waitForTimeout(900);

const box = await page.evaluate(() => {
  const svg = [...document.querySelectorAll('svg')].find((s) => s.querySelector('#gb-badge-grad'));
  const d = svg.parentElement;
  const r = d.getBoundingClientRect();
  const cs = getComputedStyle(d);
  const rect = svg.querySelector('rect');
  return {
    el: { x: r.x, y: r.y, w: r.width, h: r.height },
    left: cs.left,
    top: cs.top,
    strokeW: rect.getAttribute('stroke-width'),
    viewBox: svg.getAttribute('viewBox'),
    rectScreen: (() => {
      const b = svg.querySelectorAll('rect')[0].getBoundingClientRect();
      return { w: b.width, h: b.height };
    })(),
  };
});
console.log(JSON.stringify(box, null, 2));
await page.screenshot({
  path: `${OUT}/badge-real.png`,
  clip: { x: box.el.x - 8, y: box.el.y - 8, width: box.el.w + 30, height: box.el.h + 30 },
});
await browser.close();
