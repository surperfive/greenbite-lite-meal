/**
 * 规范改造后的视觉抽查：首页 / 点餐 / 订单 / 我的 各截一张整屏。
 *   node scripts/shot-pages.mjs [tag]
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE || 'http://127.0.0.1:5173/';
const TAG = process.argv[2] || 'after';
const OUT = 'outputs/spec-shots';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2, locale: 'zh-CN' });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#app-loading-screen', { state: 'detached', timeout: 25000 }).catch(() => {});
await page.waitForTimeout(600);

const settle = async () => {
  await page.waitForSelector('#app-loading-screen', { state: 'detached', timeout: 15000 }).catch(() => {});
  await page.getByText('跳过', { exact: true }).first().click({ timeout: 500 }).catch(() => {});
  await page.waitForTimeout(900);
  await page.evaluate(() => document.fonts.ready);
};

for (const tab of ['home', 'menu', 'gacha', 'orders', 'me']) {
  for (let i = 0; i < 3; i++) {
    await page.click(`#nav-tab-${tab}`).catch(() => {});
    await settle();
    const ok = await page.evaluate(
      (t) => document.querySelector(`#nav-tab-${t}`)?.getAttribute('aria-current') === 'page',
      tab
    );
    if (ok) break;
  }
  await page.screenshot({ path: `${OUT}/${tab}-${TAG}.png` });
  console.log('shot', tab);
}

await browser.close();
