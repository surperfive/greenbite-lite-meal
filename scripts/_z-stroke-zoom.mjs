/**
 * Z 形划痕局部放大：看两端是否被 viewBox 裁掉、线宽是否均匀。
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
  const svg = [...document.querySelectorAll('svg')].find((s) =>
    s.querySelector('path[stroke="#C8FF1A"]'),
  );
  const r = svg.getBoundingClientRect();
  const p = svg.querySelector('path');
  const pr = p.getBoundingClientRect();
  const cs = getComputedStyle(svg);
  return {
    svg: { x: r.x, y: r.y, w: r.width, h: r.height },
    path: { x: pr.x, y: pr.y, w: pr.width, h: pr.height },
    viewBox: svg.getAttribute('viewBox'),
    overflow: cs.overflow,
    preserve: svg.getAttribute('preserveAspectRatio'),
  };
});
console.log(JSON.stringify(box, null, 2));
await page.screenshot({
  path: `${OUT}/z-stroke-zoom.png`,
  clip: { x: box.svg.x - 10, y: box.svg.y - 10, width: box.svg.w + 20, height: box.svg.h + 20 },
});
await browser.close();
