/**
 * 通用定点截图：node scripts/clip-shot.mjs x y w h 缩放 输出路径
 * 缩放用 deviceScaleFactor 实现，1~6。
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const [, , X, Y, W, H, Z, OUTP] = process.argv;
mkdirSync(dirname(OUTP), { recursive: true });

const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: +Z, locale: 'zh-CN' });
await page.goto(process.env.BASE || 'http://localhost:5173/', { waitUntil: 'commit' });
await page.waitForSelector('#app-loading-screen', { state: 'detached', timeout: 25000 }).catch(() => {});
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(900);
await page.click('#nav-tab-menu').catch(() => {});
await page.waitForTimeout(700);
await page.screenshot({ path: OUTP, clip: { x: +X, y: +Y, width: +W, height: +H } });
console.log('ok ' + OUTP);
await browser.close();
