import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 410, height: 900 }, deviceScaleFactor: 3 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 25000 }).catch(()=>{});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 25000 }).catch(()=>{});
await page.waitForTimeout(400);
await page.click('#nav-tab-home');
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(()=>{});
await page.waitForTimeout(1500);
const box = await page.evaluate(() => {
  const a = document.getElementById('home-welfare-section').getBoundingClientRect();
  const b = [...document.querySelectorAll('h3')].find(h => h.textContent.includes('人气当季轻食'))?.getBoundingClientRect();
  return { x: 0, y: Math.max(0, a.y - 10), width: 410, height: Math.min(900 - a.y + 10, (b ? b.bottom : a.bottom) - a.y + 40) };
});
await page.screenshot({ path: 'scripts/_shots/hollow-context.png', clip: box });
await browser.close();
console.log('ok');
