/**
 * 临时脚本：点开「≤250大卡」筛选，单独拍筛选条，检查选中态的绿描边。
 */
import { chromium } from 'playwright';
import { BASE } from './_base.mjs';

const browser = await chromium.launch({
  executablePath:
    'C:/Users/OOW/AppData/Local/ms-playwright/chromium-1148/chrome-win/chrome.exe',
});
const page = await browser.newPage({
  viewport: { width: 420, height: 900 },
  deviceScaleFactor: 3,
});
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(2600);
await page.keyboard.press('Escape').catch(() => {});
await page.getByText('点餐', { exact: true }).last().click({ timeout: 5000 }).catch(() => {});
await page.waitForTimeout(1000);

// 筛选条 = 含 #filter-all-btn 的那一行
const bar = page.locator('#filter-all-btn').locator('xpath=..');
await page.getByText('≤250大卡', { exact: true }).click({ timeout: 5000 });
await page.waitForTimeout(500);
await bar.screenshot({ path: 'scripts/_filter-outline.png' });

// 再点第二个档位，确认切换也正常
await page.getByText('250-400大卡', { exact: true }).click({ timeout: 5000 });
await page.waitForTimeout(400);
await bar.screenshot({ path: 'scripts/_filter-outline-2.png' });

await page.screenshot({ path: 'scripts/_filter-page.png' });
await browser.close();
console.log('ok');
