/** 探针：点加号是否会冒泡到卡片、把详情页也打开（顺带看售尽时会不会弹两次 toast）。 */
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

const clickPlus = async (name) => {
  const n = page.locator(`text=${name}`).first();
  await n.evaluate((el) => el.scrollIntoView({ block: 'center' })).catch(() => {});
  await page.waitForTimeout(400);
  const box = await page.evaluate((nm) => {
    const t = [...document.querySelectorAll('p,span,div')].find((e) => e.textContent.trim() === nm);
    const card = t.closest('.group');
    const btns = [...card.querySelectorAll('button')];
    const b = btns[btns.length - 1].getBoundingClientRect();
    return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
  }, name);
  await page.mouse.click(box.x, box.y);
  await page.waitForTimeout(1200);
  const detailOpen = await page.evaluate(() => !!document.querySelector('h1'));
  return detailOpen;
};

console.log('点「希腊酸奶杯」加号 → 详情页打开？', await clickPlus('希腊酸奶杯'));
await page.keyboard.press('Escape').catch(() => {});
await page.waitForTimeout(900);
console.log('点「冷萃燕麦拿铁」加号 → 详情页打开？', await clickPlus('冷萃燕麦拿铁'));
await browser.close();
