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
await page.waitForTimeout(1200);
async function checkImgs(label) {
  const broken = await page.evaluate(() =>
    [...document.querySelectorAll('img')]
      .filter(i => i.src && (!i.complete || i.naturalWidth === 0))
      .map(i => i.src.split('/').pop())
  );
  const ok = await page.evaluate(() =>
    [...document.querySelectorAll('img')].filter(i => i.complete && i.naturalWidth > 0).length
  );
  console.log(`${label}: OK ${ok}, 破图: ${broken.length ? broken.join(',') : '无'}`);
}
await checkImgs('menu ');
await page.click('#nav-tab-home'); await stageReady(); await page.waitForTimeout(1000); await checkImgs('home ');
await page.click('#nav-tab-gacha'); await stageReady(); await page.waitForTimeout(1200); await checkImgs('gacha');
await page.click('#nav-tab-me'); await stageReady(); await page.waitForTimeout(1000); await checkImgs('me   ');
await browser.close();
