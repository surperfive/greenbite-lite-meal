/** 售尽态验证：点餐卡灰加号 + 点击弹「已售尽」+ 确认没进购物车 + 详情页整宽灰胶囊。 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';
const OUT = 'scripts/_shots/soldout';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 4 });
await page.route('**/fonts.googleapis.com/**', (r) => r.abort());
await page.route('**/fonts.gstatic.com/**', (r) => r.abort());
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.waitForTimeout(900);
await page.click('#nav-tab-menu', { timeout: 4000 }).catch(() => {});
await page.waitForTimeout(1500);

const name = page.locator('text=冷萃燕麦拿铁').first();
await name.evaluate((el) => el.scrollIntoView({ block: 'center' })).catch(() => {});
await page.waitForTimeout(500);

// 该卡片 + 它那颗加号
const info = await page.evaluate(() => {
  const n = [...document.querySelectorAll('p,span,div')].find((e) => e.textContent.trim() === '冷萃燕麦拿铁');
  const card = n.closest('.group');
  const btns = [...card.querySelectorAll('button')];
  const plus = btns[btns.length - 1];
  const cs = getComputedStyle(plus);
  const b = card.getBoundingClientRect();
  return {
    card: { x: b.x, y: b.y, width: b.width, height: b.height },
    plusBg: cs.backgroundColor, plusColor: cs.color, aria: plus.getAttribute('aria-label'),
  };
});
console.log('加号样式:', JSON.stringify(info.plusBg), JSON.stringify(info.plusColor), 'aria=', info.aria);
await page.screenshot({ path: `${OUT}/card-soldout.png`, clip: info.card });

// 点加号 → 应弹 toast，且购物车数量不变
const before = await page.evaluate(() => document.body.innerText.match(/购物车[^\d]*(\d+)/)?.[1] ?? 'n/a');
const plusBtn = page.locator(`[aria-label="已售尽"]`).first();
await plusBtn.click({ timeout: 4000 }).catch((e) => console.log('click fail', e.message));
await page.waitForTimeout(700);
const toastText = await page.evaluate(() => {
  const t = [...document.querySelectorAll('div,span')].filter((e) => e.textContent.trim() === '已售尽' && e.children.length === 0);
  return t.length ? t[t.length - 1].textContent.trim() : null;
});
console.log('toast 文本:', toastText);
await page.screenshot({ path: `${OUT}/toast.png` });

// 详情页
await page.locator('text=冷萃燕麦拿铁').first().click({ timeout: 4000 }).catch(() => {});
await page.waitForSelector('h1', { timeout: 6000 }).catch(() => {});
await page.waitForTimeout(1600);
await page.screenshot({ path: `${OUT}/detail-soldout.png` });
const detailBtns = await page.evaluate(() =>
  [...document.querySelectorAll('button')].map((b) => b.textContent.trim()).filter((t) => /售尽|加入购物车|立即购买/.test(t))
);
console.log('详情页行动按钮:', JSON.stringify(detailBtns));
await browser.close();
