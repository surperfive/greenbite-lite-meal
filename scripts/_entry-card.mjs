import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await page.route('**/fonts.googleapis.com/**', r => r.abort());
await page.route('**/fonts.gstatic.com/**', r => r.abort());
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
async function skip() {
  for (let i = 0; i < 26; i++) {
    const b = page.locator('text=跳过').first();
    if (await b.count() && await b.isVisible().catch(() => false)) { await b.click({ force: true }).catch(() => {}); await page.waitForTimeout(200); }
    else await page.waitForTimeout(160);
  }
}
await skip();
await page.locator('text=首页').first().click({ force: true }).catch(() => {});
await page.waitForTimeout(1800);
await skip();
await page.waitForTimeout(600);
await page.screenshot({ path: 'scripts/_entry-before.png', clip: { x: 0, y: 0, width: 390, height: 620 } });
const info = await page.evaluate(() => {
  const ids = ['home-takeout-card','home-pickup-card','home-benefit-card','home-gacha-card'];
  return ids.map(id => {
    const el = document.getElementById(id);
    if (!el) return { id, missing: true };
    const r = el.getBoundingClientRect();
    const img = el.querySelector('img');
    const ir = img ? img.getBoundingClientRect() : null;
    return { id, top: +r.top.toFixed(1), h: +r.height.toFixed(1), w: +r.width.toFixed(1),
             img: ir ? { top: +ir.top.toFixed(1), bottom: +ir.bottom.toFixed(1), h: +ir.height.toFixed(1), w: +ir.width.toFixed(1), src: img.getAttribute('src') } : null };
  });
});
console.log(JSON.stringify(info, null, 1));
await browser.close();
