/**
 * 量 Z 形划痕：computed 尺寸、CTM 缩放、端点是否被裁。
 */
import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 3 });
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

const info = await page.evaluate(() => {
  const svg = [...document.querySelectorAll('svg')].find((s) => s.querySelector('path[stroke="#C8FF1A"]'));
  const cs = getComputedStyle(svg);
  const path = svg.querySelector('path');
  const ctm = path.getScreenCTM();
  const pcs = getComputedStyle(path);
  return {
    svgClass: svg.getAttribute('class'),
    cssW: cs.width,
    cssH: cs.height,
    display: cs.display,
    viewBox: svg.getAttribute('viewBox'),
    ctm: { a: ctm.a, d: ctm.d, e: ctm.e, f: ctm.f },
    strokeWidthCss: pcs.strokeWidth,
    d: path.getAttribute('d'),
    parentH: getComputedStyle(svg.parentElement).height,
    parentClass: svg.parentElement.getAttribute('class'),
  };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
