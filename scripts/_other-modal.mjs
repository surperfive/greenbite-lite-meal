import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.click('#nav-tab-me');
await page.waitForTimeout(1200);
// 找「健康计划」入口
const ok = await page.evaluate(() => {
  const els = [...document.querySelectorAll('button,div[role="button"]')];
  const t = els.find(e => (e.textContent || '').includes('健康计划'));
  if (t) { t.click(); return true; } return false;
});
await page.waitForTimeout(900);
const info = await page.evaluate(() => {
  const d = document.querySelector('[role="dialog"]');
  if (!d) return { open: false };
  const inner = d.querySelector(':scope > div');
  const r = d.getBoundingClientRect();
  return { open: true, transform: getComputedStyle(inner).transform, w: +r.width.toFixed(1) };
});
console.log(JSON.stringify({ clicked: ok, ...info }));
await page.screenshot({ path: 'scripts/_shots/other-modal.png' });
await browser.close();
