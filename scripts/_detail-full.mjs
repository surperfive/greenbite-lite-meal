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
await page.locator('text=点餐').first().click({ force: true }).catch(() => {});
await page.waitForTimeout(1800);
await skip();
const card = page.locator('text=牛油果鸡胸沙拉').first();
await card.evaluate(el => el.scrollIntoView({ block: 'center' })).catch(() => {});
await page.waitForTimeout(400);
await card.click().catch(() => {});
await page.waitForSelector('h1', { timeout: 8000 });
await page.waitForTimeout(1200);
await skip();
await page.waitForTimeout(600);
// 滚动内部容器截图
const shots = [];
for (let i = 0; i < 4; i++) {
  await page.screenshot({ path: `scripts/_dsheet-${i}.png` });
  shots.push(i);
  const ok = await page.evaluate(() => {
    const sc = [...document.querySelectorAll('div')].filter(d => d.scrollHeight > d.clientHeight + 40 && getComputedStyle(d).overflowY !== 'visible');
    const el = sc.sort((a,b) => b.clientHeight - a.clientHeight)[0];
    if (!el) return false;
    const before = el.scrollTop;
    el.scrollTop = before + 260;
    return el.scrollTop !== before;
  });
  await page.waitForTimeout(500);
  if (!ok) break;
}
console.log('shots', shots.length);
await browser.close();
