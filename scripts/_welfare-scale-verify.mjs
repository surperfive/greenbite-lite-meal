/** 验证福利中心 scale=0.86 生效 + 量视觉尺寸 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';
const OUT = 'scripts/_shots';
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 410, height: 900 }, deviceScaleFactor: 3 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 25000 }).catch(()=>{});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 25000 }).catch(()=>{});
await page.waitForTimeout(400);
await page.click('#nav-tab-home');
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(()=>{});
await page.waitForTimeout(1500);
await page.click('#home-benefit-card');
await page.waitForTimeout(1500);

const m = await page.evaluate(() => {
  const h3 = [...document.querySelectorAll('h3')].find(h => (h.textContent||'').trim() === '福利中心');
  if (!h3) return null;
  const card = h3.closest('div.overflow-hidden') || h3.closest('[role=dialog]');
  const tilt = card.parentElement;
  const tb = tilt.getBoundingClientRect();
  const cb = card.getBoundingClientRect();
  const sub = [...document.querySelectorAll('p')].find(p => (p.textContent||'').includes('恭喜获得'));
  const tiny = [...document.querySelectorAll('p')].find(p => (p.textContent||'').includes('自取 / 外卖均可使用'));
  return {
    tiltTransform: getComputedStyle(tilt).transform,
    visualW: +tb.width.toFixed(1),
    visualH: +tb.height.toFixed(1),
    cardW: +cb.width.toFixed(1),
    sideMargin: +cb.left.toFixed(1),
    subFont: sub ? getComputedStyle(sub).fontSize : null,
    tinyFont: tiny ? getComputedStyle(tiny).fontSize : null,
    hasScroll: (() => { const s = document.querySelector('.gb-modal-scroll'); return s ? s.scrollHeight > s.clientHeight + 1 : null; })(),
  };
});
console.log(JSON.stringify(m, null, 2));
await page.screenshot({ path: `${OUT}/welfare-final-086.png` });
await browser.close();
