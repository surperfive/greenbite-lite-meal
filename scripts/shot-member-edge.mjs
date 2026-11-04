/**
 * 首页会员条白描边：2 / 3 / 4px 三档对照
 * 白边是 box-shadow spread，不占布局，所以三档只影响外扩宽度。
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE || 'http://127.0.0.1:5173/';
const OUT = process.argv[2] || 'outputs/member-white-edge';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage({
  viewport: { width: 430, height: 932 },
  deviceScaleFactor: 3,
  locale: 'zh-CN',
});

await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#app-loading-screen', { state: 'attached', timeout: 10000 }).catch(() => {});
await page.waitForSelector('#app-loading-screen', { state: 'detached', timeout: 25000 }).catch(() => {});
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(900);

// ⚠️ 默认落地页是「点餐」，会员条在首页 —— 必须先切 tab
await page.click('#nav-tab-home').catch(() => {});
await page.waitForTimeout(900);

const bar = page.locator('#home-member-bar').first();
await bar.scrollIntoViewIfNeeded();
await page.waitForTimeout(400);

const shot = async (label) => {
  const d = await bar.evaluate((el) => {
    const s = getComputedStyle(el);
    const b = el.getBoundingClientRect();
    return { w: +b.width.toFixed(2), h: +b.height.toFixed(2), shadow: s.boxShadow };
  });
  const box = await bar.boundingBox();
  await page.screenshot({
    path: `${OUT}/${label}.png`,
    clip: {
      x: Math.max(0, box.x - 14),
      y: Math.max(0, box.y - 12),
      width: Math.min(430, box.width + 28),
      height: box.height + 24,
    },
  });
  return d;
};

const real = await shot('05-px-actual');

// 4px / 7px 用 CSS 覆写复刻，仅用于挑档
for (const px of [4, 7]) {
  await page.addStyleTag({
    content: `#home-member-bar{box-shadow:0 0 0 ${px}px #FFF,0 4px 16px rgba(0,0,0,.10)!important}`,
  });
  await page.waitForTimeout(200);
  await shot(`0${px}-px`);
}

console.log(JSON.stringify(real, null, 2));
await browser.close();
