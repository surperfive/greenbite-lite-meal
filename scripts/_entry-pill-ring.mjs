import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 410, height: 900 } });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 25000 }).catch(()=>{});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 25000 }).catch(()=>{});
await page.waitForTimeout(400);
await page.click('#nav-tab-home');
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(()=>{});
await page.waitForTimeout(1200);
const r = await page.evaluate(() => {
  const pills = [...document.querySelectorAll('span.rounded-full')]
    .filter(s => /^(HOT|FRESH|WOW|FREE)$/.test((s.textContent||'').trim()));
  return pills.map(p => ({ label: p.textContent.trim(), boxShadow: getComputedStyle(p).boxShadow }));
});
console.log(JSON.stringify(r, null, 2));
await browser.close();
