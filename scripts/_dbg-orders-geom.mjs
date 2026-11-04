import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 3 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
try {
  await page.waitForSelector('.brand-loader__skip', { timeout: 8000 });
  await page.click('.brand-loader__skip');
  await page.waitForSelector('.brand-loader__skip', { state: 'detached', timeout: 8000 });
} catch {}
await page.waitForTimeout(1000);
await page.click('#nav-tab-orders', { timeout: 5000 });
await page.waitForSelector('input[placeholder*="订单"]', { timeout: 8000 });
await page.waitForTimeout(600);
const info = await page.evaluate(() => {
  const cards = [...document.querySelectorAll('.rounded-\\[20px\\]')].filter((c) =>
    c.querySelector('img')
  );
  return cards.map((card) => {
    const band = card.querySelector('.bg-\\[\\#C7F665\\]');
    const thumb = card.querySelector('.overflow-hidden.flex-shrink-0');
    const name = card.querySelector('p.truncate');
    const price = card.querySelector('.text-\\[\\#E60012\\]');
    const r = (el) => { const b = el.getBoundingClientRect(); return { top: +b.top.toFixed(1), bottom: +b.bottom.toFixed(1), left: +b.left.toFixed(1), right: +b.right.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1) }; };
    return {
      store: card.querySelector('span.truncate')?.textContent,
      band: band ? r(band) : null,
      thumb: r(thumb),
      thumbCls: thumb.className.match(/w-\[[^\]]+\] h-\[[^\]]+\]/)?.[0],
      nameText: name?.textContent,
      nameTruncated: name ? name.scrollWidth > name.clientWidth + 1 : null,
      nameW: name ? +name.clientWidth.toFixed(1) : null,
      priceRight: price ? r(price).right : null,
      cardH: +card.getBoundingClientRect().height.toFixed(1),
    };
  });
});
for (const c of info) {
  console.log(`--- ${c.store} ---`);
  console.log(`  缩略图 ${c.thumbCls}: left=${c.thumb.left} top=${c.thumb.top} w=${c.thumb.w} h=${c.thumb.h}`);
  console.log(`  青柠带底=${c.band.bottom} → 缩略图净空=${(c.thumb.top - c.band.bottom).toFixed(1)}px`);
  console.log(`  菜名宽=${c.nameW} 截断=${c.nameTruncated} | 价格右缘=${c.priceRight} | 卡高=${c.cardH}`);
}
await browser.close();
