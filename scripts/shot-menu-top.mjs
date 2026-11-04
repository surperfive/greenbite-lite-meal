/**
 * 点餐页头部截图：确认头图与白卡的接缝处是否还有圆角。
 *
 * 只截顶部 320px，够看清 外卖/自提 + 搜索行。
 *   node scripts/shot-menu-top.mjs
 */
import { chromium } from 'playwright';
import { BASE } from './_base.mjs';

const out = 'outputs/menu-top';

// 本机 playwright 自带的 chromium 已被 `playwright install ffmpeg` 清掉（2026-10-31），
// 统一改用系统 Chrome —— 与 shot-pages / shot-home-cards 等脚本一致。
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForSelector('#app-loading-screen', { state: 'detached', timeout: 30000 });
await page.evaluate(() => document.fonts.ready);

// 进点餐页
await page.getByRole('button', { name: /点餐|点单/ }).first().click().catch(() => {});
await page.waitForTimeout(1200);
await page.evaluate(() => document.fonts.ready);

await page.screenshot({ path: `${out}/menu-top.png`, clip: { x: 0, y: 0, width: 390, height: 320 } });

// 顺便量一下白卡上沿的圆角半径与位置
const info = await page.evaluate(() => {
  const banner = document.querySelector('#menu-header-banner');
  const card = banner?.nextElementSibling;
  if (!card) return null;
  const cs = getComputedStyle(card);
  const r = card.getBoundingClientRect();
  return {
    bannerH: banner.getBoundingClientRect().height,
    cardTop: r.top,
    radius: cs.borderTopLeftRadius,
    boxShadow: cs.boxShadow,
  };
});
console.log(JSON.stringify(info, null, 2));

await browser.close();
