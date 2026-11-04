/** 首页整页滚动截图（分段），用于人工检查卡片区上下文 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const OUT = 'outputs/home-cards';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
await page.goto('http://127.0.0.1:5173/', { waitUntil: 'load' });
await page.waitForSelector('#nav-tab-home', { state: 'visible', timeout: 25000 });
await page.waitForTimeout(1200);

async function ensureHome() {
  for (let i = 0; i < 6; i++) {
    await page.evaluate(() => document.querySelector('#nav-tab-home')?.click());
    await page.waitForTimeout(700);
    if (await page.evaluate(() => !!document.querySelector('#home-popular-dishes-section'))) return;
    await page.reload({ waitUntil: 'load' });
    await page.waitForTimeout(1500);
  }
}
await ensureHome();
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(600);

// 滚到底，让卡片区完整进入一屏
await page.evaluate(() => {
  const s = document.querySelector('#home-popular-dishes-section');
  s.scrollIntoView({ block: 'end' });
});
await page.waitForTimeout(700);
await page.screenshot({ path: `${OUT}/home-bottom.png` });

await page.evaluate(() => {
  const st = document.querySelector('#app-page-stage');
  st?.scrollTo?.({ top: 0, behavior: 'instant' });
  window.scrollTo(0, 0);
});
await page.waitForTimeout(700);
await page.screenshot({ path: `${OUT}/home-top.png` });

console.log('ok');
await browser.close();
