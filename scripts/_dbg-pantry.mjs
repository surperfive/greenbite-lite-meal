import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 } });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.waitForTimeout(600);
await page.click('#nav-tab-gacha');
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 15000 }).catch(() => {});
await page.waitForSelector('#btn-category-select-all-pill', { state: 'visible', timeout: 15000 });
await page.waitForTimeout(900);
const info = await page.evaluate(() => {
  const spans = [...document.querySelectorAll('span')];
  const w35 = spans.filter((s) => typeof s.className === 'string' && s.className.includes('w-3.5'));
  const rf = spans.filter((s) => typeof s.className === 'string' && s.className.includes('rounded-full'));
  return {
    totalSpan: spans.length,
    w35: w35.length,
    roundedFull: rf.length,
    w35sample: w35.slice(0, 3).map((s) => s.className),
    buttons: document.querySelectorAll('button').length,
    // 找 SSR/SR/R 稀有度标签数量，定位食材网格是否渲染
    rarity: spans.filter((s) => /^(SSR|SR|R)$/.test(s.textContent || '')).length,
  };
});
console.log(JSON.stringify(info, null, 1));
await browser.close();
