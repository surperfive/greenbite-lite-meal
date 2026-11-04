/** 门店弹窗缩到 0.9 后，在常见视口下复核留白（防标准手机上显空）。 */
import { chromium } from 'playwright';
import { BASE } from './_base.mjs';

const browser = await chromium.launch({ channel: 'chrome' });
for (const vp of [{ w: 435, h: 700 }, { w: 390, h: 844 }, { w: 430, h: 932 }, { w: 1440, h: 900 }]) {
  const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 1 });
  await page.goto(BASE, { waitUntil: 'commit' });
  await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
  await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
  await page.waitForTimeout(700);
  await page.click('[title="点击切换门店"]');
  await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
  await page.waitForTimeout(800);
  const r = await page.evaluate(() => {
    const dlg = document.querySelector('[role="dialog"]');
    const card = dlg.querySelector('div:nth-child(2)');
    const b = card.getBoundingClientRect();
    const shell = document.getElementById('app-page-stage').parentElement.getBoundingClientRect();
    const body = dlg.querySelector('.gb-modal-scroll');
    return {
      visual: `${Math.round(b.width)}x${Math.round(b.height)}`,
      gapLR: Math.round((b.left - shell.left + shell.right - b.right) / 2),
      gapTB: Math.round(b.top - Math.max(shell.top, 0)),
      overflow: body ? body.scrollHeight - body.clientHeight : null,
    };
  });
  console.log(`${vp.w}x${vp.h}`, JSON.stringify(r));
  await page.close();
}
await browser.close();
