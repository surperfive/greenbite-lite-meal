import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#nav-tab-home', { timeout: 20000 });
await page.waitForTimeout(2400);
const info = await page.evaluate(() => {
  const n = document.querySelectorAll('[aria-label^="切换到第"]').length;
  const hero = document.querySelector('div.h-\\[304px\\]');
  const pills = Array.from(document.querySelectorAll('div')).filter(d => /bg-black\/35/.test(d.className?.toString?.() || ''));
  return {
    dots: n,
    heroFound: !!hero,
    heroHTML: hero ? hero.outerHTML.slice(0, 700) : null,
    blackPills: pills.length,
  };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
