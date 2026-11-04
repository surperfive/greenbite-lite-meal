import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 1 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.click('#nav-tab-gacha');
await page.waitForTimeout(1500);
await page.click('#btn-header-info');
await page.waitForSelector('[role="dialog"]', { timeout: 4000 });
await page.waitForTimeout(600);
const m = await page.evaluate(() => {
  const body = document.querySelector('[role="dialog"] .gb-modal-scroll');
  const rows = [...body.children];
  const rowH = rows.map(r => Math.round(r.getBoundingClientRect().height));
  const ownedIdx = rows.map((r, i) => r.className.includes('ECFDC0') ? i : -1).filter(i => i >= 0);
  // 第一行相对弹窗顶的位置
  const d = document.querySelector('[role="dialog"]').getBoundingClientRect();
  const first = rows[0].getBoundingClientRect();
  return { total: rows.length, ownedIdx, rowH: rowH.slice(0, 5), listTopOffset: +(first.top - d.top).toFixed(1) };
});
console.log(JSON.stringify(m));
await browser.close();
