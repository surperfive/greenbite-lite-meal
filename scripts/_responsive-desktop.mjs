import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 25000 }).catch(()=>{});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 25000 });
await page.waitForTimeout(2500);
const info = await page.evaluate(() => {
  const stage = document.getElementById('app-page-stage');
  const shell = stage.parentElement.parentElement;
  const r = shell.getBoundingClientRect();
  return { shellLeft:+r.left.toFixed(1), shellRight:+r.right.toFixed(1), shellW:+r.width.toFixed(1),
           viewportW: window.innerWidth, bezel: getComputedStyle(shell).borderWidth };
});
console.log(JSON.stringify(info));
await page.screenshot({ path: 'scripts/_shots/resp-1440-home2.png' });
await browser.close();
