/**
 * 头图整条 3× 截图（只截 banner 区域），用来肉眼判断"色块"问题
 * 用法：node scripts/shot-banner-strip.mjs [输出目录] [后缀]
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE || 'http://127.0.0.1:5173/';
const OUT = process.argv[2] || 'outputs/banner-strip';
const TAG = process.argv[3] || 'now';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 3, locale: 'zh-CN' });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#app-loading-screen', { state: 'detached', timeout: 25000 }).catch(() => {});
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(900);
await page.click('#nav-tab-menu').catch(() => {});
await page.waitForTimeout(800);

const g = await page.evaluate(() => {
  const b = document.querySelector('#menu-header-banner').getBoundingClientRect();
  return { x: b.x, y: b.y, w: b.width, h: b.height };
});

await page.screenshot({ path: `${OUT}/${TAG}-strip.png`, clip: { x: 0, y: 0, width: 430, height: Math.ceil(g.h) + 24 } });
console.log(JSON.stringify(g));
await browser.close();
