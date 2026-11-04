import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 1 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.waitForTimeout(1200);
for (const tab of ['home','menu','orders','me']) {
  await page.click(`#nav-tab-${tab}`);
  await page.waitForTimeout(1000);
  // 滚到底再回顶，确保内容都渲染过
  await page.evaluate(() => { const sc = document.querySelector('.overflow-y-auto'); if (sc) { sc.scrollTop = 99999; } });
  await page.waitForTimeout(400);
  await page.evaluate(() => { const sc = document.querySelector('.overflow-y-auto'); if (sc) { sc.scrollTop = 0; } });
  await page.waitForTimeout(500);
  // 整页滚动截图（分屏）
  const H = await page.evaluate(() => document.querySelector('.overflow-y-auto')?.scrollHeight || 932);
  for (let y = 0; y + 932 < H + 932; y += 900) {
    await page.evaluate((v) => { const sc = document.querySelector('.overflow-y-auto'); if (sc) sc.scrollTop = v; }, y);
    await page.waitForTimeout(350);
    await page.screenshot({ path: `scripts/_shots/_loc-${tab}-${y}.png` });
    if (y + 932 >= H) break;
  }
  console.log(tab, 'height', H);
}
await browser.close();
