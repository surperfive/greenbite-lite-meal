import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
for (const W of [430, 375]) {
  const page = await browser.newPage({ viewport: { width: W, height: 900 }, deviceScaleFactor: 1 });
  await page.goto(BASE, { waitUntil: 'commit' });
  await page.waitForSelector('#nav-tab-home', { timeout: 20000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(2000);
  await page.click('#nav-tab-gacha');
  await page.waitForTimeout(2600);
  const m = await page.evaluate(() => {
    const h = document.querySelector('#gacha-page-root header');
    const cap = document.getElementById('mp-capsule').getBoundingClientRect();
    const tok = document.getElementById('btn-header-tokens').getBoundingClientRect();
    const info = document.getElementById('btn-header-info').getBoundingClientRect();
    const hr = h.getBoundingClientRect();
    return {
      shellW: +document.querySelector('#app-page-stage').getBoundingClientRect().width.toFixed(1),
      headerH: +hr.height.toFixed(1),
      headerBottom: +hr.bottom.toFixed(1),
      capLeft: +cap.left.toFixed(1),
      tokRight: +tok.right.toFixed(1),
      infoRight: +info.right.toFixed(1),
      gapInfoCap: +(cap.left - info.right).toFixed(1),
      hasTitleText: !!document.querySelector('#gacha-page-root header h1')?.textContent?.trim(),
      h1Visible: (() => {
        const e = document.querySelector('#gacha-page-root header h1');
        const r = e.getBoundingClientRect();
        return r.width > 1 && r.height > 1;
      })(),
    };
  });
  console.log(W, JSON.stringify(m));
  await page.close();
}
await browser.close();
