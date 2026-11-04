import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#nav-tab-home', { timeout: 20000 });
await page.waitForTimeout(2400);
const info = await page.evaluate(() => {
  const img = document.querySelector('img[src*="ordering_header_banner"]');
  const chain = [];
  let el = img;
  for (let i = 0; i < 5 && el; i++) {
    chain.push(`${el.tagName}.${(el.className?.toString?.() || '').slice(0, 90)}`);
    el = el.parentElement;
  }
  return { chain, hasDotText: document.body.innerHTML.includes('切换到第') };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
