import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';
fs.mkdirSync('scripts/_shots', { recursive: true });
const CASES = [
  { w: 320, h: 760, tag: '320-menu', tab: 'menu' },
  { w: 390, h: 844, tag: '390-menu', tab: 'menu' },
  { w: 1440, h: 900, tag: '1440-home', tab: 'home' },
];
const browser = await chromium.launch({ channel: 'chrome' });
for (const c of CASES) {
  const page = await browser.newPage({ viewport: { width: c.w, height: c.h }, deviceScaleFactor: 1 });
  await page.goto(BASE, { waitUntil: 'commit' });
  await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(()=>{});
  await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 }).catch(()=>{});
  await page.waitForTimeout(500);
  await page.click(`#nav-tab-${c.tab}`);
  await page.waitForTimeout(800);
  await page.screenshot({ path: `scripts/_shots/resp-${c.tag}.png` });
  await page.close();
}
await browser.close();
console.log('ok');
