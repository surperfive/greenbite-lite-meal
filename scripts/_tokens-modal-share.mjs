/** 点「去分享」：弹窗应关闭、token +1、toast 出现 */
import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 } });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.waitForTimeout(600);
await page.click('#nav-tab-gacha');
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 15000 }).catch(() => {});
await page.waitForSelector('#btn-header-tokens', { state: 'visible', timeout: 15000 });
await page.waitForTimeout(800);
const before = await page.locator('#btn-header-tokens').textContent();
await page.click('#btn-header-tokens');
await page.waitForTimeout(800);
await page.evaluate(() => {
  [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === '去分享')?.click();
});
await page.waitForTimeout(700);
const after = await page.evaluate(() => ({
  modalOpen: !![...document.querySelectorAll('h3')].find((e) => e.textContent?.includes('获取')),
  tokens: document.getElementById('btn-header-tokens')?.textContent?.trim(),
  bodyHasToast: document.body.textContent?.includes('分享成功'),
}));
console.log('前:', before?.trim(), '后:', JSON.stringify(after));
await browser.close();
