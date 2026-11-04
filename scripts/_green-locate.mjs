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
await page.waitForTimeout(4000);
for (const tab of ['home', 'gacha', 'me', 'menu']) {
  await page.click(`#nav-tab-${tab}`);
  await stageReady();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `scripts/_shots/locate-${tab}.png`, fullPage: true });
}
await browser.close();
