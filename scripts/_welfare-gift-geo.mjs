import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#nav-tab-home', { timeout: 20000 });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(2200);
await page.click('#nav-tab-home'); await page.waitForTimeout(1200);
await page.click('#home-benefit-card'); await page.waitForTimeout(1600);
const m = await page.evaluate(() => {
  const gift = document.querySelector('.wf-gift').getBoundingClientRect();
  const card = document.querySelector('.wf-board').getBoundingClientRect();
  const title = document.querySelector('.wf-title-group').getBoundingClientRect();
  const s = getComputedStyle(document.querySelector('.wf-gift'));
  return {
    gift: `x${gift.left.toFixed(1)} y${gift.top.toFixed(1)} ${gift.width.toFixed(1)}×${gift.height.toFixed(1)} bottom${gift.bottom.toFixed(1)}`,
    card: `x${card.left.toFixed(1)} y${card.top.toFixed(1)} ${card.width.toFixed(1)}×${card.height.toFixed(1)}`,
    title: `x${title.left.toFixed(1)} y${title.top.toFixed(1)} ${title.width.toFixed(1)}×${title.height.toFixed(1)}`,
    aboveCard: +(card.top - gift.top).toFixed(1),
    overlapY: +(gift.bottom - card.top).toFixed(1),
    gapGiftTitle: +(title.left - gift.right).toFixed(1),
    cssTop: s.top, cssLeft: s.left,
  };
});
console.log(JSON.stringify(m, null, 2));
await browser.close();
