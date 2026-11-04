/**
 * 抽卡页食材卡片「kcal / 价格」这一行的宽度余量探针。
 *
 * 目的：价格字号要从 13px 放大到「视觉上明显大于 kcal」，
 * 但卡片是固定 3 列，这一行是 justify-between，放大后会挤。
 * 先把**最宽的一组数据**（180 kcal + ¥15）的真实占宽量出来，再定字号。
 *
 * 用法：node scripts/probe-price-size.mjs
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { BASE } from './_base.mjs';

const OUT = 'probe-out/price-size';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 3 });
await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
const page = await ctx.newPage();

await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#nav-tab-gacha', { timeout: 60000 });
await page.waitForTimeout(600);
await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((x) => x.textContent?.trim() === '跳过');
  b?.click();
});
await page.waitForTimeout(900);
await page.click('#nav-tab-gacha');
await page.waitForTimeout(1200);
await page.evaluate(() =>
  document.querySelector('#unified-pantry-collection-section')?.scrollIntoView({ block: 'center' })
);
await page.waitForTimeout(600);

const m = await page.evaluate(() => {
  const cards = [...document.querySelectorAll('.grid > [class*="aspect-square"]')];
  const rows = cards.map((card) => {
    const row = card.lastElementChild;             // kcal / 价格行
    const kcalPill = row.firstElementChild;
    const priceWrap = row.lastElementChild;
    const kcalSpan = kcalPill.firstElementChild;
    const priceSpan = priceWrap.firstElementChild;
    const cs = getComputedStyle(row);
    const rr = row.getBoundingClientRect();
    const contentW = rr.width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    return {
      name: card.querySelector('h4')?.textContent?.trim(),
      kcalText: kcalSpan.textContent.trim(),
      priceText: priceSpan.textContent.trim(),
      rowW: +contentW.toFixed(1),
      kcalW: +kcalPill.getBoundingClientRect().width.toFixed(1),
      priceW: +priceSpan.getBoundingClientRect().width.toFixed(1),
      kcalFont: getComputedStyle(kcalSpan).fontSize,
      priceFont: getComputedStyle(priceSpan).fontSize,
    };
  });
  // 最紧的一张：可用余量最小
  const tight = rows
    .map((r) => ({ ...r, slack: +(r.rowW - r.kcalW - r.priceW).toFixed(1) }))
    .sort((a, b) => a.slack - b.slack)[0];
  return { count: rows.length, tight, widestKcal: rows.find((r) => r.kcalText.startsWith('180')) };
});

console.log('卡片数：', m.count);
console.log('最紧一张：', JSON.stringify(m.tight, null, 2));
console.log('180 kcal 那张：', JSON.stringify(m.widestKcal, null, 2));

// 同一张卡上，把价格字号逐个试一遍，看还剩多少余量
const trials = await page.evaluate(() => {
  const card = [...document.querySelectorAll('.grid > [class*="aspect-square"]')].find((c) =>
    c.textContent.includes('180 kcal')
  );
  if (!card) return null;
  const row = card.lastElementChild;
  const kcalPill = row.firstElementChild;
  const priceSpan = row.lastElementChild.firstElementChild;
  const cs = getComputedStyle(row);
  const contentW =
    row.getBoundingClientRect().width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  const out = [];
  for (const px of [13, 14, 15, 16, 17]) {
    priceSpan.style.fontSize = `${px}px`;
    out.push({
      px,
      priceW: +priceSpan.getBoundingClientRect().width.toFixed(1),
      slack: +(contentW - kcalPill.getBoundingClientRect().width - priceSpan.getBoundingClientRect().width).toFixed(1),
    });
  }
  priceSpan.style.fontSize = '';
  return { contentW: +contentW.toFixed(1), kcalW: +kcalPill.getBoundingClientRect().width.toFixed(1), out };
});
console.log('价格字号试算：', JSON.stringify(trials, null, 2));

await page.screenshot({ path: `${OUT}/card-row.png`, timeout: 60000 });
await browser.close();
