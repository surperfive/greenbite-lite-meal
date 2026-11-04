import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 4 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 30000 }).catch(() => {});
await page.waitForFunction(() => {
  const s = document.getElementById('app-page-stage');
  return s && getComputedStyle(s).opacity === '1';
}, { timeout: 30000 });
await page.click('#nav-tab-gacha');
await page.waitForFunction(() => {
  const s = document.getElementById('app-page-stage');
  return s && getComputedStyle(s).opacity === '1';
}, { timeout: 30000 });
await page.waitForTimeout(1500);
const box = await page.evaluate(() => {
  const crown = document.getElementById('badge-crown');
  const txt = document.getElementById('txt-discount');
  const cr = crown.getBoundingClientRect();
  const tr = txt.getBoundingClientRect();
  return {
    crown: { x: cr.x, y: cr.y, w: cr.width, h: cr.height },
    text: { x: tr.x, y: tr.y, w: tr.width, h: tr.height },
  };
});
console.log(JSON.stringify(box));
const clip = { x: Math.max(0, box.crown.x - 6), y: Math.max(0, box.crown.y - 10), width: (box.text.x + box.text.w) - box.crown.x + 14, height: box.text.h + 20 };
await page.screenshot({ path: 'scripts/_shots/badge-crown-before.png', clip });
await browser.close();
