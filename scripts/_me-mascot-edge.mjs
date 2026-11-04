/** 量「我的」页 banner 里吉祥物本体的左缘 x（按行扫高饱和绿像素），用来决定进度条能画多宽。 */
import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 3 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.click('#nav-tab-me');
await page.waitForTimeout(1300);
await page.screenshot({ path: 'scripts/_shots/me-band.png', clip: { x: 10, y: 0, width: 410, height: 156 } });
await browser.close();
