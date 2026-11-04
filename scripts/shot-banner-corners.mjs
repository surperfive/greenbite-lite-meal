/**
 * 头图四角 6× 放大：确认海报自带的深色圆角残留到底看不看得见
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE || 'http://127.0.0.1:5173/';
const OUT = process.argv[2] || 'outputs/banner-corners';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 6, locale: 'zh-CN' });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#app-loading-screen', { state: 'detached', timeout: 25000 }).catch(() => {});
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(900);
await page.click('#nav-tab-menu').catch(() => {});
await page.waitForTimeout(800);

const g = await page.evaluate(() => {
  const b = document.querySelector('#menu-banner-image').getBoundingClientRect();
  return { x: b.x, y: b.y, w: b.width, h: b.height };
});

const S = 36; // 放大窗口边长（CSS px）
const spots = {
  tl: { x: g.x - 4, y: g.y - 4 },
  tr: { x: g.x + g.w - S + 4, y: g.y - 4 },
  bl: { x: g.x - 4, y: g.y + g.h - S + 4 },
  br: { x: g.x + g.w - S + 4, y: g.y + g.h - S + 4 },
};

for (const [k, p] of Object.entries(spots)) {
  await page.screenshot({
    path: `${OUT}/${k}.png`,
    clip: { x: Math.max(0, p.x), y: Math.max(0, p.y), width: S, height: S },
  });
}

console.log(JSON.stringify({ banner: g, spots }, null, 2));
await browser.close();
