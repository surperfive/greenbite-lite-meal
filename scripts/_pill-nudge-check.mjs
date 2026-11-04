/** 列出所有 .pill-label：字号、transform 矩阵、真实位移量。 */
import { chromium } from 'playwright';
import { BASE } from './_base.mjs';

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 3 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.click('#nav-tab-menu');
await page.waitForTimeout(1500);

const out = await page.evaluate(() => {
  return [...document.querySelectorAll('.pill-label')].map((sp) => {
    const cs = getComputedStyle(sp);
    const r0 = sp.getBoundingClientRect();
    const old = sp.style.transform;
    sp.style.transform = 'none';
    const r1 = sp.getBoundingClientRect();
    sp.style.transform = old;
    return {
      text: sp.textContent.trim().slice(0, 10),
      fs: cs.fontSize,
      display: cs.display,
      matrix: cs.transform,
      h: +r0.height.toFixed(2),
      delta: +(r1.top - r0.top).toFixed(2),
    };
  });
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
