import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
import { mkdirSync } from 'node:fs';

const OUT = process.argv[2] ?? 'outputs/hero-basafish-v3';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 3 });
await page.goto(BASE, { waitUntil: 'commit' });

// ⚠️ 别点「跳过」：点它会让 overlay 卡在 finishing 态不卸载（实测）。
// 品牌 loader 会等资源就绪后自行完成（约 4s），这里直接等它卸掉。
await page.waitForSelector('#app-loading-screen', { state: 'attached', timeout: 10000 }).catch(() => {});
await page.waitForSelector('#app-loading-screen', { state: 'detached', timeout: 25000 });
await page.waitForTimeout(400);

await page.waitForSelector('#nav-tab-home', { timeout: 15000 });
await page.click('#nav-tab-home');
await page.waitForTimeout(2000);
await page.mouse.move(3, 3);
await page.waitForTimeout(300);

const hero = page.locator('div.relative.w-full.h-\\[304px\\]').first();
await hero.waitFor({ timeout: 15000 });
await hero.screenshot({ path: `${OUT}/hero.png` });
await page.screenshot({ path: `${OUT}/home-top.png`, clip: { x: 0, y: 0, width: 430, height: 560 } });

const info = await page.evaluate(() => {
  const heroEl = document.querySelector('div.relative.w-full.h-\\[304px\\]');
  const r = heroEl.getBoundingClientRect();
  return {
    loader: !!document.querySelector('#app-loading-screen'),
    hero: [+r.width.toFixed(1), +r.height.toFixed(1)],
    dots: document.querySelectorAll('button[aria-label^="切换到第"]').length,
    imgs: [...heroEl.querySelectorAll('img')].map((i) => ({
      src: i.getAttribute('src'),
      loaded: i.complete && i.naturalWidth > 0,
    })),
  };
});
console.log(JSON.stringify(info, null, 1));
await browser.close();
