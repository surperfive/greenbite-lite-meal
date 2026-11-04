import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
import { mkdirSync } from 'node:fs';

const OUT = process.argv[2] ?? 'outputs/hero-posters-v1';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 3 });
await page.goto(BASE, { waitUntil: 'commit' });

// ⚠️ 别点「跳过」：点它会让 overlay 卡在 finishing 态不卸载（实测）。
await page.waitForSelector('#app-loading-screen', { state: 'attached', timeout: 10000 }).catch(() => {});
await page.waitForSelector('#app-loading-screen', { state: 'detached', timeout: 25000 });
await page.waitForTimeout(400);

await page.waitForSelector('#nav-tab-home', { timeout: 15000 });
await page.click('#nav-tab-home');
await page.waitForTimeout(1800);
await page.mouse.move(3, 3);
await page.waitForTimeout(200);

const hero = page.locator('div.relative.w-full.h-\\[304px\\]').first();
await hero.waitFor({ timeout: 15000 });

const total = await page.locator('button[aria-label^="切换到第"]').count();
for (let i = 0; i < total; i++) {
  await page.locator('button[aria-label^="切换到第"]').nth(i).click();
  await page.waitForTimeout(1000);
  await hero.screenshot({ path: `${OUT}/slide-${i + 1}.png` });
}
await page.locator('button[aria-label^="切换到第"]').nth(0).click();
await page.waitForTimeout(900);
await page.screenshot({ path: `${OUT}/home-top.png`, clip: { x: 0, y: 0, width: 430, height: 620 } });

const info = await page.evaluate(() => {
  const heroEl = document.querySelector('div.relative.w-full.h-\\[304px\\]');
  const r = heroEl.getBoundingClientRect();
  return {
    hero: [+r.width.toFixed(1), +r.height.toFixed(1)],
    dots: document.querySelectorAll('button[aria-label^="切换到第"]').length,
    imgs: [...heroEl.querySelectorAll('img')].map((i) => ({
      src: i.getAttribute('src'),
      nat: [i.naturalWidth, i.naturalHeight],
      rendered: [Math.round(i.clientWidth), Math.round(i.clientHeight)],
      loaded: i.complete && i.naturalWidth > 0,
    })),
  };
});
console.log(JSON.stringify(info, null, 1));
await browser.close();
