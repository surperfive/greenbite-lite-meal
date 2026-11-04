/**
 * 临时脚本：1x 下抓真实实现（不打补丁），确认选中态绿描边的实际观感。
 */
import { chromium } from 'playwright';
import { BASE } from './_base.mjs';

const browser = await chromium.launch({
  executablePath:
    'C:/Users/OOW/AppData/Local/ms-playwright/chromium-1148/chrome-win/chrome.exe',
});
const page = await browser.newPage({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 1 });
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(2600);
await page.keyboard.press('Escape').catch(() => {});
await page.getByText('点餐', { exact: true }).last().click({ timeout: 5000 }).catch(() => {});
await page.waitForTimeout(900);

const bar = page.locator('#filter-all-btn').locator('xpath=..');
await page.getByText('≤250大卡', { exact: true }).click({ timeout: 5000 });
await page.waitForTimeout(600);
await bar.screenshot({ path: 'scripts/_real-1x-a.png' });

await page.getByText('250-400大卡', { exact: true }).click({ timeout: 5000 });
await page.waitForTimeout(600);
await bar.screenshot({ path: 'scripts/_real-1x-b.png' });

await page.screenshot({ path: 'scripts/_real-1x-page.png' });
await browser.close();
console.log('ok');
