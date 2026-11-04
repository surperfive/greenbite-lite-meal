import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 1 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 30000 }).catch(() => {});
async function stageReady() {
  await page.waitForFunction(() => {
    const s = document.getElementById('app-page-stage');
    return s && getComputedStyle(s).opacity === '1';
  }, { timeout: 30000 });
}
await stageReady();
await page.waitForTimeout(2000);
// 找到滚动容器滚到底
await page.evaluate(() => {
  const scrollers = [...document.querySelectorAll('*')].filter(el => el.scrollHeight > el.clientHeight + 100 && el.clientHeight > 300);
  scrollers.forEach(el => el.scrollTop = el.scrollHeight);
});
await page.waitForTimeout(1200);
await page.screenshot({ path: 'scripts/_shots/menu-bottom.png' });
await browser.close();
