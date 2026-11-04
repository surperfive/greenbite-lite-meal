/**
 * 诊断：订单卡右侧「实付 ¥xx」的右边界，与其他右对齐元素比对。
 * 量的是 getBoundingClientRect().right，单位 CSS px。
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { BASE } from './_base.mjs';

const OUT = 'outputs/diag-price-align';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({
  viewport: { width: 430, height: 932 },
  deviceScaleFactor: 3,
  locale: 'zh-CN',
});

await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#app-loading-screen', { state: 'attached', timeout: 10000 }).catch(() => {});
await page.waitForSelector('#app-loading-screen', { state: 'detached', timeout: 30000 });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(600);
await page.click('#nav-tab-orders');
await page.waitForTimeout(1200);

const data = await page.evaluate(() => {
  const priceColorDiv = document.querySelector('[class*="FC259B"]');
  const priceBox = priceColorDiv.parentElement;
  const priceRow = priceBox.parentElement;
  const card = priceBox.closest('div[class*="bg-white"]');
  const stack = priceRow.parentElement;

  const r = (el) => {
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return { l: +b.left.toFixed(1), r: +b.right.toFixed(1), w: +b.width.toFixed(1), t: +b.top.toFixed(1), b: +b.bottom.toFixed(1) };
  };

  // 同一张卡里的其他右对齐元素
  const banner = priceRow.nextElementSibling;                 // 状态横幅
  const btnRow = banner?.nextElementSibling;                  // 按钮行
  const badge = card.querySelector('div.justify-between > div:last-child') || null;
  const lastBtn = btnRow ? btnRow.lastElementChild : null;

  const cs = (el) => {
    if (!el) return null;
    const s = getComputedStyle(el);
    return { pr: s.paddingRight, mr: s.marginRight, w: s.width };
  };

  // 最右侧一个字符的实际墨迹：用 Range 取文本节点末尾
  const numSpan = priceColorDiv.querySelectorAll('span')[1];
  let inkRight = null;
  if (numSpan) {
    const rg = document.createRange();
    rg.selectNodeContents(numSpan);
    inkRight = +rg.getBoundingClientRect().right.toFixed(1);
  }

  return {
    card: r(card),
    stack: r(stack),
    row: r(priceRow),
    priceBox: r(priceBox),
    priceBoxStyle: cs(priceBox),
    numberInkRight: inkRight,
    banner: r(banner),
    bannerStyle: cs(banner),
    bannerInner: banner ? r(banner.lastElementChild) : null,
    btnRow: r(btnRow),
    lastBtn: r(lastBtn),
    badge: r(badge),
    badgeStyle: cs(badge),
    stackStyle: cs(stack),
    stackClass: stack.className,
  };
});

console.log(JSON.stringify(data, null, 2));
await browser.close();
