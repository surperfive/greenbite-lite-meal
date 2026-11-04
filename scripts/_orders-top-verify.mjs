import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.waitForTimeout(500);
await page.click('#nav-tab-orders');
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 15000 }).catch(() => {});
await page.waitForTimeout(900);
const g = await page.evaluate(() => {
  const header = document.querySelector('input[type=text]')?.closest('div.sticky');
  const input = document.querySelector('input[type=text]');
  const stage = document.getElementById('app-page-stage');
  const shell = stage.parentElement.getBoundingClientRect();
  const hb = header.getBoundingClientRect();
  const ib = input.getBoundingClientRect();
  return {
    shellTop: +shell.top.toFixed(2),
    headerTop: +hb.top.toFixed(2),
    headerH: +hb.height.toFixed(2),
    inputTop: +ib.top.toFixed(2),
    inputH: +ib.height.toFixed(2),
    gapAboveInput: +(ib.top - shell.top).toFixed(2),
  };
});
console.log(JSON.stringify(g, null, 2));
await browser.close();
