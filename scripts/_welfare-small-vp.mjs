/** 左右对调后的小视口复核：礼盒不能被壳裁掉、标题不能压边框。 */
import { chromium } from 'playwright';
import { BASE } from './_base.mjs';

const browser = await chromium.launch({ channel: 'chrome' });
for (const vp of [{ width: 375, height: 812 }, { width: 390, height: 844 }, { width: 435, height: 700 }]) {
  const page = await browser.newPage({ viewport: vp, deviceScaleFactor: 2 });
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(BASE, { waitUntil: 'commit' });
  await page.waitForSelector('#nav-tab-home', { timeout: 20000 });
  await page.waitForTimeout(700);
  await page.click('#nav-tab-home');
  await page.waitForSelector('#home-benefit-card', { timeout: 8000 });
  await page.waitForTimeout(700);
  await page.click('#home-benefit-card');
  await page.waitForSelector('#welfare-center-stage', { timeout: 5000 });
  await page.waitForTimeout(900);
  const r = await page.evaluate(() => {
    const R = (s) => { const b = document.querySelector(s).getBoundingClientRect(); return { x: +b.x.toFixed(1), r: +b.right.toFixed(1), y: +b.y.toFixed(1), b: +b.bottom.toFixed(1) }; };
    const shell = document.getElementById('app-page-stage').parentElement.getBoundingClientRect();
    return {
      shell: { x: +shell.x.toFixed(1), r: +shell.right.toFixed(1) },
      gift: R('.wf-gift'),
      card: R('.wf-board'),
      title: R('.wf-title-group'),
      close: R('.wf-close'),
    };
  });
  console.log(`${vp.width}x${vp.height}`, JSON.stringify(r), errs.length ? 'ERR:' + errs[0] : 'no-error');
  await page.screenshot({ path: `scripts/_shots/welfare-swap-${vp.width}.png` });
  await page.close();
}
await browser.close();
