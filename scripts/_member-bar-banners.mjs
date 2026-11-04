/** 三张 banner 逐一检查：骑缝的身份条是否压住海报关键内容 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';
const OUT = 'scripts/_shots';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.waitForTimeout(600);
await page.click('#nav-tab-home');
await page.waitForSelector('#home-member-bar', { timeout: 15000 });
await page.waitForTimeout(1600);

const clip = await page.evaluate(() => {
  const b = document.getElementById('home-member-bar').getBoundingClientRect();
  return { x: b.x - 10, y: Math.max(0, b.top - 150), width: b.width + 20, height: b.height + 220 };
});

for (let i = 0; i < 3; i++) {
  await page.click(`[aria-label="切换到第 ${i + 1} 张轮播图"]`);
  // ⚠️ 不能只 waitForTimeout(900)：轮播是横向 track，三张图都在 DOM 里，
  // 切换未完成时目标图宽度是 416/425 之类的中间值，截出来还是上一张。
  // 判据 = 第 i 张的宽度落到 410（hero 宽）且左边缘在视口内。
  await page.waitForFunction(
    (idx) => {
      const imgs = [...document.querySelectorAll('img')].filter((im) =>
        /hero-poster/.test(im.currentSrc || im.src)
      );
      const im = imgs[idx];
      if (!im) return false;
      const r = im.getBoundingClientRect();
      return Math.abs(r.width - 410) < 0.6 && r.left > -1 && r.left < 40;
    },
    i,
    { timeout: 8000 }
  );
  await page.waitForTimeout(260);
  await page.screenshot({ path: `${OUT}/mb-banner-${i + 1}.png`, clip });
  console.log('banner', i + 1, 'ok');
}

await browser.close();
