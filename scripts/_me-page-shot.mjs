/** 「我的」页整页截图（登录态 / 未登录态）。 */
import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.click('#nav-tab-me');
await page.waitForTimeout(1300);
await page.screenshot({ path: 'scripts/_shots/me-page-full.png' });
// 退出登录态
await page.getByText('退出登录 / 切换账号').click();
await page.waitForTimeout(900);
await page.screenshot({ path: 'scripts/_shots/me-page-guest.png', clip: { x: 10, y: 0, width: 410, height: 260 } });
console.log('ok');
await browser.close();
