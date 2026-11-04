import { chromium } from 'playwright';
const BASE = 'http://127.0.0.1:5173/';
const OUT = 'outputs/align2';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
for (const t of ['home', 'menu', 'gacha', 'orders', 'me']) {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2700);
  if (t !== 'menu') {
    await page.click(`#nav-tab-${t}`, { force: true });
    await page.waitForTimeout(2500);
  }
  await page.screenshot({ path: `${OUT}/final-${t}.png` });
}
await browser.close();
console.log('done');
