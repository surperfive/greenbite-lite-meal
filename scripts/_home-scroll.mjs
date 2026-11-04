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
await page.waitForTimeout(400);
for (let i = 0; i < 5; i++) {
  const ok = await page.evaluate(() => {
    const sc = [...document.querySelectorAll('div')].filter(d => d.scrollHeight > d.clientHeight + 40 && getComputedStyle(d).overflowY !== 'visible');
    const el = sc.sort((a,b) => b.clientHeight - a.clientHeight)[0];
    if (!el) return false;
    const b = el.scrollTop; el.scrollTop = b + 300; return el.scrollTop !== b;
  });
  await page.waitForTimeout(450);
  await page.screenshot({ path: `scripts/_home-${i}.png` });
  if (!ok) break;
}
await browser.close();
