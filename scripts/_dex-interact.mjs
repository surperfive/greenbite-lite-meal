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
await page.waitForTimeout(800);

// 1) 内部滚动
const before = await page.evaluate(() => document.querySelector('[role="dialog"] .gb-modal-scroll').scrollTop);
await page.mouse.move(215, 500);
await page.mouse.wheel(0, 260);
await page.waitForTimeout(400);
const after = await page.evaluate(() => document.querySelector('[role="dialog"] .gb-modal-scroll').scrollTop);
console.log('scroll', before, '->', after, after > before ? 'OK' : 'FAIL');

// 2) 底部按钮可点（关闭）
await page.click('[role="dialog"] button:has-text("我知道了")');
await page.waitForTimeout(600);
console.log('close by button:', await page.evaluate(() => !document.getElementById('gacha-dex-modal')) ? 'OK' : 'FAIL');

// 3) 关闭钮可点
await page.click('#btn-header-info');
await page.waitForSelector('[role="dialog"]', { timeout: 4000 });
await page.waitForTimeout(600);
await page.click('[role="dialog"] button[aria-label="关闭"]');
await page.waitForTimeout(600);
console.log('close by X:', await page.evaluate(() => !document.getElementById('gacha-dex-modal')) ? 'OK' : 'FAIL');

// 4) 其它 StickerModal 弹窗未受影响（scale 默认 1）
await page.click('#btn-header-info');
await page.waitForTimeout(500);
const t = await page.evaluate(() => {
  const d = document.querySelector('[role="dialog"] > div');
  return getComputedStyle(d).transform;
});
console.log('dex transform:', t);
await browser.close();
