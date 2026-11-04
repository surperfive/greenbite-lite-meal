/** 礼盒「水平翻转 + 右移」A/B：DOM 直接改 .wf-gift 的 right/width/翻转，截图挑构图。 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';
fs.mkdirSync('scripts/_shots', { recursive: true });

const variants = [
  { tag: 'v0-now', right: 10, width: 218, height: 215, flip: false, titleLeft: -6 },
  { tag: 'v1-flip', right: 10, width: 218, height: 215, flip: true, titleLeft: -6 },
  { tag: 'v2-flip-r12', right: -12, width: 204, height: 201, flip: true, titleLeft: -6 },
  { tag: 'v3-flip-r26', right: -26, width: 200, height: 197, flip: true, titleLeft: -10 },
];

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.waitForTimeout(800);
await page.click('#nav-tab-home');
await page.waitForSelector('#home-benefit-card', { timeout: 8000 });
await page.waitForTimeout(700);
await page.click('#home-benefit-card');
await page.waitForSelector('#welfare-center-stage', { timeout: 5000 });
await page.waitForTimeout(900);

for (const v of variants) {
  const info = await page.evaluate((v) => {
    const gift = document.querySelector('.wf-gift');
    const svg = gift.querySelector('svg');
    const title = document.querySelector('.wf-title-group');
    gift.style.animation = 'none';
    gift.style.right = v.right + 'px';
    gift.style.width = v.width + 'px';
    gift.style.height = v.height + 'px';
    svg.style.transform = v.flip ? 'scaleX(-1)' : '';
    svg.style.transformOrigin = 'center center';
    title.style.left = v.titleLeft + 'px';
    const gb = gift.getBoundingClientRect();
    const tb = title.getBoundingClientRect();
    return {
      gift: { x: +gb.x.toFixed(1), right: +gb.right.toFixed(1), y: +gb.y.toFixed(1), b: +gb.bottom.toFixed(1) },
      title: { x: +tb.x.toFixed(1), right: +tb.right.toFixed(1), y: +tb.y.toFixed(1), b: +tb.bottom.toFixed(1) },
      gapX: +(gb.x - tb.right).toFixed(1),
    };
  }, v);
  await page.waitForTimeout(150);
  await page.screenshot({ path: `scripts/_shots/gift-${v.tag}.png` });
  console.log(v.tag, JSON.stringify(info));
}
await browser.close();
