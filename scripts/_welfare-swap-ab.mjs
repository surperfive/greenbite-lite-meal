/** 「礼盒左 / 文字右」A/B：礼盒左移量 + 标题右对齐量，挑最平衡的一档。 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';
fs.mkdirSync('scripts/_shots', { recursive: true });

const variants = [
  { tag: 'd-left38-r20', giftLeft: -38, giftTop: -60, w: 180, h: 177, titleRight: -20 },
  { tag: 'e-left30-r20', giftLeft: -30, giftTop: -58, w: 186, h: 182, titleRight: -20 },
  { tag: 'f-left34-r28', giftLeft: -34, giftTop: -62, w: 188, h: 184, titleRight: -28 },
];

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#nav-tab-home', { timeout: 20000 });
await page.waitForTimeout(700);
await page.click('#nav-tab-home');
await page.waitForSelector('#home-benefit-card', { timeout: 8000 });
await page.waitForTimeout(700);
await page.click('#home-benefit-card');
await page.waitForSelector('#welfare-center-stage', { timeout: 5000 });
await page.waitForTimeout(900);

for (const v of variants) {
  const info = await page.evaluate((v) => {
    const gift = document.querySelector('.wf-gift');
    const title = document.querySelector('.wf-title-group');
    gift.style.animation = 'none';
    gift.style.right = 'auto';
    gift.style.left = v.giftLeft + 'px';
    gift.style.top = v.giftTop + 'px';
    gift.style.width = v.w + 'px';
    gift.style.height = v.h + 'px';
    title.style.left = 'auto';
    title.style.right = v.titleRight + 'px';
    const gb = gift.getBoundingClientRect();
    const tb = title.getBoundingClientRect();
    const card = document.querySelector('.wf-board').getBoundingClientRect();
    return {
      gift: { x: +gb.x.toFixed(1), r: +gb.right.toFixed(1), y: +gb.y.toFixed(1), b: +gb.bottom.toFixed(1) },
      title: { x: +tb.x.toFixed(1), r: +tb.right.toFixed(1), y: +tb.y.toFixed(1) },
      card: { x: +card.x.toFixed(1), r: +card.right.toFixed(1) },
      giftOutLeft: +(card.x - gb.x).toFixed(1),
      giftOutTop: +(card.y - gb.y).toFixed(1),
      gapX: +(tb.x - gb.right).toFixed(1),
    };
  }, v);
  await page.waitForTimeout(150);
  // ⚠️ 偶发 `waiting for fonts to load` 卡死（dev server 字体请求挂起），重试一次
  await page.evaluate(() => document.fonts.ready.catch(() => {}));
  await page.screenshot({ path: `scripts/_shots/swap-${v.tag}.png`, timeout: 15000 }).catch(async () => {
    await page.waitForTimeout(500);
    await page.screenshot({ path: `scripts/_shots/swap-${v.tag}.png`, timeout: 20000 });
  });
  console.log(v.tag, JSON.stringify(info));
}
await browser.close();
