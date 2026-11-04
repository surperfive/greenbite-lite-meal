import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 30000 }).catch(() => {});
await page.waitForFunction(() => {
  const s = document.getElementById('app-page-stage');
  return s && getComputedStyle(s).opacity === '1';
}, { timeout: 30000 });
await page.click('#nav-tab-me');
await page.waitForFunction(() => {
  const s = document.getElementById('app-page-stage');
  return s && getComputedStyle(s).opacity === '1';
}, { timeout: 30000 });
await page.waitForTimeout(1200);
// 找到资产卡与服务中心，滚动到位后视口截图
await page.evaluate(() => {
  const h3 = [...document.querySelectorAll('h3, span, div')].find(e => e.textContent.trim() === '服务中心');
  (h3?.closest('div[class*="rounded"]')?.parentElement ?? document.body).scrollIntoView({ block: 'center' });
});
await page.waitForTimeout(600);
await page.screenshot({ path: 'scripts/_shots/me-redyellow.png' });
console.log('shot ok');
await browser.close();
