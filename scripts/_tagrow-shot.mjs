import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 4 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.click('#nav-tab-menu');
await page.waitForTimeout(1000);
const box = await page.evaluate(() => {
  // 找到「8.0折」这个 span，再取它父级（那一行）
  const spans = [...document.querySelectorAll('span')];
  const s = spans.find((e) => /^\d\.\d折$/.test(e.textContent.trim()) && e.getBoundingClientRect().width < 60);
  if (!s) return null;
  const row = s.parentElement;
  const r = row.getBoundingClientRect();
  return { x: Math.max(0, r.left - 8), y: Math.max(0, r.top - 10), width: Math.min(r.width + 16, 430), height: r.height + 20, rowH: r.height };
});
if (!box) { console.log('miss'); } else {
  console.log(JSON.stringify(box));
  await page.screenshot({ path: 'scripts/_shots/rows2/cardtags.png', clip: { x: box.x, y: box.y, width: box.width, height: box.height } });
}
await browser.close();
