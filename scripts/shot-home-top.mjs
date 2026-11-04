/**
 * 首页顶部整段截图：看身份条骑缝是否还压在 hero 底边、与四宫格的关系。
 *   node scripts/shot-home-top.mjs [tag]
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE || 'http://127.0.0.1:5173/';
const TAG = process.argv[2] || 'now';
const OUT = 'outputs/home-top';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2, locale: 'zh-CN' });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#app-loading-screen', { state: 'detached', timeout: 25000 }).catch(() => {});
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(800);
await page.click('#nav-tab-home');
await page.waitForTimeout(900);

// 开场还有一层 FRESH FOOD 品牌过场（不叫 app-loading-screen），右下角有「跳过」
await page.getByText('跳过', { exact: true }).first().click({ timeout: 2000 }).catch(() => {});
await page.waitForTimeout(1600);

await page.screenshot({ path: `${OUT}/home-top-${TAG}.png`, clip: { x: 0, y: 0, width: 430, height: 560 } });

const m = await page.evaluate(() => {
  const bar = document.querySelector('#home-member-bar');
  const b = bar.getBoundingClientRect();
  const hero = bar.closest('div.relative.w-full')?.firstElementChild?.getBoundingClientRect();
  return {
    bar: { top: +b.top.toFixed(1), h: +b.height.toFixed(1), center: +(b.top + b.height / 2).toFixed(1) },
    heroBottom: hero ? +hero.bottom.toFixed(1) : null,
  };
});
console.log(JSON.stringify(m));
await browser.close();
