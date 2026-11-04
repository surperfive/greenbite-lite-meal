import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.waitForTimeout(600);
await page.click('#nav-tab-home');
await page.waitForSelector('#home-member-bar', { timeout: 15000 });
await page.waitForTimeout(1600);

const dots = await page.evaluate(() =>
  [...document.querySelectorAll('[aria-label^="切换到第"]')].map(e => e.getAttribute('aria-label'))
);
console.log('dots:', dots);

const activeImg = () => page.evaluate(() => {
  const imgs = [...document.querySelectorAll('#home-member-bar')].length
    ? [...document.querySelectorAll('img')].filter(i => /hero-poster/.test(i.currentSrc || i.src))
    : [];
  return imgs.map(i => ({
    src: (i.currentSrc || i.src).split('/').pop(),
    w: Math.round(i.getBoundingClientRect().width),
    op: getComputedStyle(i).opacity,
  }));
});

for (let i = 1; i <= 3; i++) {
  await page.click(`[aria-label="切换到第 ${i} 张轮播图"]`);
  await page.waitForTimeout(1000);
  console.log('after dot', i, JSON.stringify(await activeImg()));
}
await browser.close();
