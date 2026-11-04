import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#nav-tab-home', { timeout: 20000 });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(2200);
await page.click('#nav-tab-home');
await page.waitForTimeout(1200);
await page.click('#home-benefit-card');
await page.waitForTimeout(1500);
// 领取
await page.getByRole('button', { name: '领取', exact: true }).click();
await page.waitForTimeout(500);
const toast = await page.evaluate(() => {
  const t = document.querySelector('.wf-toast');
  if (!t) return null;
  const cs = getComputedStyle(t);
  return { text: t.textContent, color: cs.color, bg: cs.backgroundColor, opacity: cs.opacity };
});
await page.screenshot({ path: 'scripts/_shots/welfare-toast.png', clip: { x: 0, y: 300, width: 430, height: 420 } });
console.log('toast:', JSON.stringify(toast));
console.log('errors:', errs.length ? errs : 'none');
await browser.close();
