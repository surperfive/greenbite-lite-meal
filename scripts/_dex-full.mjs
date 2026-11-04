import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.click('#nav-tab-gacha');
await page.waitForTimeout(1500);
await page.click('#btn-header-info');
await page.waitForSelector('[role="dialog"]', { timeout: 4000 });
await page.waitForTimeout(900);
await page.screenshot({ path: 'scripts/_shots/dex-full.png' });
// 徽章/关闭钮是否被裁 + 卡片四边到壳的距离
const m = await page.evaluate(() => {
  const shell = document.querySelector('[data-app-stage-box]').getBoundingClientRect();
  const card = document.getElementById('gacha-dex-modal').getBoundingClientRect();
  const badge = document.querySelector('[role="dialog"] .pointer-events-none.absolute').getBoundingClientRect();
  return {
    left: +(card.left - shell.left).toFixed(1),
    right: +(shell.right - card.right).toFixed(1),
    top: +(card.top - shell.top).toFixed(1),
    bottom: +(shell.bottom - card.bottom).toFixed(1),
    badgeTop: +badge.top.toFixed(1), badgeLeft: +badge.left.toFixed(1),
    shellTop: +shell.top.toFixed(1), shellLeft: +shell.left.toFixed(1),
  };
});
console.log(JSON.stringify(m));
await browser.close();
