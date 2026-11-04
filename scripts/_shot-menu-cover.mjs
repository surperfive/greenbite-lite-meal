/**
 * 临时截图脚本：抓「点餐」页菜品封面，用于对齐视觉。
 * 用法：node scripts/_shot-menu-cover.mjs
 */
import { chromium } from 'playwright';
import { BASE } from './_base.mjs';

const browser = await chromium.launch({
  // 本机只装了 chromium-1148，包内默认找 1248，这里直接指定可执行文件
  executablePath:
    'C:/Users/OOW/AppData/Local/ms-playwright/chromium-1148/chrome-win/chrome.exe',
});
const page = await browser.newPage({
  viewport: { width: 420, height: 900 },
  deviceScaleFactor: 3,
});

page.on('pageerror', (e) => console.log('[pageerror]', e.message));
page.on('console', (m) => {
  if (m.type() === 'error') console.log('[console.error]', m.text());
});

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(2600);

// 关掉可能弹出的登录框（按 Esc 兜底）
await page.keyboard.press('Escape').catch(() => {});

// 进「点餐」
const menuTab = page.getByText('点餐', { exact: true }).last();
await menuTab.click({ timeout: 5000 }).catch(() => {});
await page.waitForTimeout(1200);

await page.screenshot({ path: 'scripts/_shot-menu-full.png' });

const thumbs = page.locator('[data-dish-thumb="true"]');
const n = await thumbs.count();
console.log('thumbs:', n);
for (let i = 0; i < Math.min(n, 6); i++) {
  await thumbs.nth(i).screenshot({ path: `scripts/_shot-thumb-${i}.png` });
}

await browser.close();
