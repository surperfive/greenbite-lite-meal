/**
 * 量「我的」页「我的订单」卡 + 同排「服务中心」卡的几何。
 * 用法：node scripts/probe-me-order-card.mjs [--shot]
 *   --shot 额外输出 outputs/me-order/pair.png（两卡 3× 截图）
 *
 * ⚠️ 卡内标题已经画进卡面图里，DOM 里没有「我的订单」这段文字了，
 *    所以定位靠 `img[src*="me-order-card"]` 的父级，别再按文字找。
 *    旧版 HTML 卡面（有文字）回退后也能定位 —— 兜底会去找 `.order-art-slot`。
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { BASE } from './_base.mjs';

const OUT = 'outputs/me-order';
mkdirSync(OUT, { recursive: true });
const SHOT = process.argv.includes('--shot');

const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({
  viewport: { width: 420, height: 1000 },
  deviceScaleFactor: 3
});
await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
const page = await ctx.newPage();

await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#nav-tab-me', { timeout: 60000 });
await page.waitForTimeout(500);
await page.evaluate(() => {
  [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === '跳过')?.click();
});
await page.waitForTimeout(700);
await page.click('#nav-tab-me');
await page.waitForTimeout(1200);

const res = await page.evaluate(() => {
  const img = document.querySelector('img[src*="me-order-card"]');
  const orderCard = img?.closest('.col-span-7') || document.querySelector('.order-art-slot')?.closest('.col-span-7');
  if (!orderCard) return { error: '没找到订单卡' };
  const svcTitle = [...document.querySelectorAll('span')].find((s) => s.textContent?.trim() === '服务中心');
  const svcCard = svcTitle?.closest('.col-span-5');
  const row = orderCard.parentElement;

  const box = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
      x: +r.x.toFixed(1), y: +r.y.toFixed(1),
      w: +r.width.toFixed(1), h: +r.height.toFixed(1),
      ratio: +(r.width / r.height).toFixed(3)
    };
  };
  const inner = (el) => {
    if (!el) return null;
    const cs = getComputedStyle(el);
    return {
      pad: [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].join(' '),
      radius: cs.borderRadius,
      bg: cs.backgroundColor,
      scrollH: el.scrollHeight,
      clientH: el.clientHeight
    };
  };
  return {
    row: box(row),
    orderCard: box(orderCard),
    orderInner: inner(orderCard),
    orderImg: box(img),
    imgNatural: img ? [img.naturalWidth, img.naturalHeight] : null,
    imgFit: img ? getComputedStyle(img).objectFit : null,
    svcCard: box(svcCard),
    svcInner: inner(svcCard)
  };
});

console.log(JSON.stringify(res, null, 2));

if (SHOT && !res.error) {
  await page.screenshot({
    path: `${OUT}/pair.png`,
    clip: {
      x: res.row.x - 2,
      y: res.orderCard.y - 4,
      width: res.row.w + 4,
      height: Math.max(res.orderCard.h, res.svcCard.h) + 8
    }
  });
  console.log(`\n输出：${OUT}/pair.png`);
}

await browser.close();
