/** 售尽改动回归：正常菜仍能加购、售尽菜点了不加（读浮动购物车角标数字）。 */
import { chromium } from 'playwright';
import { BASE } from './_base.mjs';

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
await page.route('**/fonts.googleapis.com/**', (r) => r.abort());
await page.route('**/fonts.gstatic.com/**', (r) => r.abort());
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.waitForTimeout(900);
await page.click('#nav-tab-menu', { timeout: 4000 }).catch(() => {});
await page.waitForTimeout(1500);

const badge = () =>
  page.evaluate(() => {
    const el = [...document.querySelectorAll('span,div')].find((e) =>
      /min-w-\[17px\]/.test(e.className || '') && /^\d+$/.test(e.textContent.trim())
    );
    return el ? el.textContent.trim() : '0';
  });

const cardPlus = async (dishName) => {
  const n = page.locator(`text=${dishName}`).first();
  await n.evaluate((el) => el.scrollIntoView({ block: 'center' })).catch(() => {});
  await page.waitForTimeout(400);
  const box = await page.evaluate((name) => {
    const t = [...document.querySelectorAll('p,span,div')].find((e) => e.textContent.trim() === name);
    const card = t.closest('.group');
    const btns = [...card.querySelectorAll('button')];
    const b = btns[btns.length - 1].getBoundingClientRect();
    return { x: b.x + b.width / 2, y: b.y + b.height / 2, aria: btns[btns.length - 1].getAttribute('aria-label') };
  }, dishName);
  await page.mouse.click(box.x, box.y);
  await page.waitForTimeout(900);
  return box.aria;
};

console.log('初始角标:', await badge());
console.log('正常菜 希腊酸奶杯 加号 aria =', await cardPlus('希腊酸奶杯'), '→ 角标', await badge());
console.log('售尽菜 冷萃燕麦拿铁 加号 aria =', await cardPlus('冷萃燕麦拿铁'), '→ 角标', await badge());
await browser.close();
