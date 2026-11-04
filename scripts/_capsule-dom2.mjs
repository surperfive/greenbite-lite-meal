import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#nav-tab-home', { timeout: 20000 });
await page.waitForTimeout(2400);
const info = await page.evaluate(() => {
  const stage = document.getElementById('app-page-stage');
  const kids = Array.from(stage.children).map((c) => `${c.tagName}#${c.id || '-'}.${(c.className?.toString?.() || '').slice(0, 70)}`);
  const imgs = Array.from(document.querySelectorAll('img')).slice(0, 8).map((i) => i.getAttribute('src'));
  return { kids, imgs };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
