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
const CLIP = { x: 0, y: 300, width: 390, height: 480 };
await page.screenshot({ path: 'scripts/_entry-new.png', clip: CLIP });

// 还原成旧版：125 高 + 插画 bottom 4px + 标签 bottom 52px
await page.evaluate(() => {
  const ids = ['home-takeout-card','home-pickup-card','home-benefit-card','home-gacha-card'];
  for (const id of ids) {
    const card = document.getElementById(id);
    card.style.minHeight = '125px';
    const imgWrap = card.children[2];
    imgWrap.style.bottom = '4px';
    const badge = card.children[1];
    badge.style.bottom = '52px';
  }
});
await page.waitForTimeout(400);
await page.screenshot({ path: 'scripts/_entry-old.png', clip: CLIP });
const h = await page.evaluate(() => ['home-takeout-card','home-benefit-card'].map(id => document.getElementById(id).getBoundingClientRect().height));
console.log('old heights', h);
await browser.close();
