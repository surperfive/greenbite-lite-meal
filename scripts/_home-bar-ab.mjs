import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const LEVELS = [46, 42, 40, 38];
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 4 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.click('#nav-tab-home');
await page.waitForTimeout(1500);
const clip = await page.evaluate(() => {
  const r = document.getElementById('home-member-bar').getBoundingClientRect();
  return { x: Math.max(0, r.left - 10), y: Math.max(0, r.top - 14), width: Math.min(r.width + 20, 430), height: r.height + 30 };
});
for (const h of LEVELS) {
  await page.evaluate((H) => {
    document.getElementById('ab2')?.remove();
    const py = (H - 31) / 2;
    const s = document.createElement('style');
    s.id = 'ab2';
    s.textContent = `#home-member-bar{min-height:${H}px!important;padding-top:${py}px!important;padding-bottom:${py}px!important;border-radius:${H / 2}px!important}`;
    document.head.appendChild(s);
  }, h);
  await page.waitForTimeout(200);
  const m = await page.evaluate(() => { const r = document.getElementById('home-member-bar').getBoundingClientRect(); return { h: +r.height.toFixed(2), top: +r.top.toFixed(1) }; });
  console.log(h, JSON.stringify(m));
  await page.screenshot({ path: `scripts/_shots/home-bar-h${h}.png`, clip });
}
await browser.close();
