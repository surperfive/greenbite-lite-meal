/** 福利中心弹窗「整体缩小」A/B：scale 0.94 / 0.90 / 0.86 / 0.82 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';
const OUT = 'scripts/_shots';
fs.mkdirSync(OUT, { recursive: true });
const VARIANTS = [
  { id: 's100', s: 1.0 },
  { id: 's94', s: 0.94 },
  { id: 's90', s: 0.90 },
  { id: 's86', s: 0.86 },
  { id: 's82', s: 0.82 },
];
const browser = await chromium.launch({ channel: 'chrome' });
for (const v of VARIANTS) {
  const page = await browser.newPage({ viewport: { width: 410, height: 900 }, deviceScaleFactor: 3 });
  await page.goto(BASE, { waitUntil: 'commit' });
  await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 25000 }).catch(()=>{});
  await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 25000 }).catch(()=>{});
  await page.waitForTimeout(400);
  await page.click('#nav-tab-home');
  await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(()=>{});
  await page.waitForTimeout(1500);
  await page.click('#home-benefit-card');
  await page.waitForTimeout(1400);

  const m = await page.evaluate(({ s }) => {
    // 倾斜层：主卡的父级 div（带 style.transform 的那个）
    const h3 = [...document.querySelectorAll('h3')].find(h => (h.textContent||'').trim() === '福利中心');
    if (!h3) return null;
    const card = h3.closest('div[id]') || h3.closest('[role=dialog]');
    let tilt = card.parentElement;
    const before = tilt.getBoundingClientRect();
    if (s !== 1) {
      const t = getComputedStyle(tilt).transform;
      tilt.style.transform = (t && t !== 'none' ? t + ' ' : '') + `scale(${s})`;
      tilt.style.transformOrigin = 'center center';
    }
    const after = tilt.getBoundingClientRect();
    return {
      cardLayout: `${before.width.toFixed(0)}x${before.height.toFixed(0)}`,
      visual: `${after.width.toFixed(0)}x${after.height.toFixed(0)}`,
      transform: getComputedStyle(tilt).transform,
    };
  }, v);
  console.log(v.id, JSON.stringify(m));
  await page.screenshot({ path: `${OUT}/welfare-${v.id}.png` });
  await page.close();
}
await browser.close();
