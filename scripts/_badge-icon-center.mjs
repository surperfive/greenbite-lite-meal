import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.click('#nav-tab-gacha');
await page.waitForTimeout(1500);
await page.click('#btn-header-info');
await page.waitForSelector('[role="dialog"]', { timeout: 4000 });
await page.waitForTimeout(900);
const m = await page.evaluate(() => {
  const badge = document.querySelector('[role="dialog"] .z-20.pointer-events-none.absolute');
  const svg = badge.querySelector('svg');
  const b = badge.getBoundingClientRect();
  const s = svg.getBoundingClientRect();
  const cx = (r) => r.x + r.width / 2, cy = (r) => r.y + r.height / 2;
  // 再取 ink bbox（SVG 内部几何）判断图形是否在 viewBox 里居中
  const path = svg.querySelectorAll('path, circle, rect, line, polyline, polygon');
  let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
  for (const p of path) {
    const bb = p.getBBox();
    minX = Math.min(minX, bb.x); minY = Math.min(minY, bb.y);
    maxX = Math.max(maxX, bb.x + bb.width); maxY = Math.max(maxY, bb.y + bb.height);
  }
  return {
    dx: +(cx(s) - cx(b)).toFixed(2), dy: +(cy(s) - cy(b)).toFixed(2),
    viewBox: svg.getAttribute('viewBox'),
    ink: { x: +minX.toFixed(2), y: +minY.toFixed(2), w: +(maxX - minX).toFixed(2), h: +(maxY - minY).toFixed(2) },
  };
});
console.log(JSON.stringify(m));
await browser.close();
