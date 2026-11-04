/** 验证四张入口卡主标签已改红框红字 */
import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 410, height: 900 }, deviceScaleFactor: 4 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 25000 }).catch(()=>{});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 25000 }).catch(()=>{});
await page.waitForTimeout(400);
await page.click('#nav-tab-home');
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(()=>{});
await page.waitForTimeout(1300);

const r = await page.evaluate(() => {
  const pills = [...document.querySelectorAll('span.rounded-full')]
    .filter(s => /^(HOT|FRESH|WOW|FREE)$/.test((s.textContent||'').trim()));
  return pills.map(p => {
    const cs = getComputedStyle(p);
    const b = p.getBoundingClientRect();
    return {
      label: p.textContent.trim(),
      color: cs.color,
      ring: cs.boxShadow.split(',')[0],
      size: `${b.width.toFixed(1)}x${b.height.toFixed(1)}`,
    };
  });
});
console.log(JSON.stringify(r, null, 2));

const box = await page.evaluate(() => {
  const pill = [...document.querySelectorAll('span.rounded-full')].find(s => (s.textContent||'').trim()==='HOT');
  const grid = pill.closest('div.grid') || pill.closest('div').parentElement.parentElement.parentElement;
  const g = grid.getBoundingClientRect();
  return { x: Math.max(0,g.x-2), y: Math.max(0,g.y-2), width: Math.min(410-g.x+2,g.width+4), height: Math.min(900-g.y+2,g.height+4) };
});
await page.screenshot({ path: 'scripts/_shots/entrypill-final.png', clip: box });
await browser.close();
