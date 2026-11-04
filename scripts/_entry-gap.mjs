import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
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
const out = await page.evaluate(() => {
  const ids = ['home-takeout-card','home-pickup-card','home-benefit-card','home-gacha-card'];
  return ids.map(id => {
    const card = document.getElementById(id);
    const cr = card.getBoundingClientRect();
    const img = card.querySelector('img');
    const ir = img.getBoundingClientRect();
    const sub = card.querySelector('p').getBoundingClientRect();
    const title = card.querySelector('span').getBoundingClientRect();
    return { id, cardTop: +cr.top.toFixed(1), cardBottom: +cr.bottom.toFixed(1),
      imgTop: +ir.top.toFixed(1), gapBottom: +(cr.bottom - ir.bottom).toFixed(1),
      subBottom: +sub.bottom.toFixed(1), titleBottom: +title.bottom.toFixed(1),
      gapToSub: +(ir.top - sub.bottom).toFixed(1) };
  });
});
console.log(JSON.stringify(out, null, 1));
for (const [i, id] of ['home-takeout-card','home-pickup-card','home-benefit-card','home-gacha-card'].entries()) {
  const b = await page.evaluate((id) => { const r = document.getElementById(id).getBoundingClientRect(); return {x:r.x,y:r.y,width:r.width,height:r.height}; }, id);
  await page.screenshot({ path: `scripts/_card-${i}.png`, clip: { x: b.x - 2, y: b.y - 2, width: b.width + 4, height: b.height + 4 } });
}
await browser.close();
