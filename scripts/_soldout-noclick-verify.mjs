/** 售尽卡不能进详情。每次开新页，避免上一次的详情页残留 DOM 造成假阳性。 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';
const OUT = 'scripts/_shots/soldout';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
await ctx.route('**/fonts.googleapis.com/**', (r) => r.abort());
await ctx.route('**/fonts.gstatic.com/**', (r) => r.abort());

const run = async (name, shot) => {
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'commit' });
  await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
  await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
  await page.waitForTimeout(900);
  await page.click('#nav-tab-menu', { timeout: 4000 }).catch(() => {});
  await page.waitForTimeout(1600);

  const n = page.locator(`text=${name}`).first();
  await n.evaluate((el) => el.scrollIntoView({ block: 'center' })).catch(() => {});
  await page.waitForTimeout(400);
  const box = await n.boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(900);

  const res = await page.evaluate(() => {
    const btnTexts = [...document.querySelectorAll('button')].map((b) => b.textContent.trim());
    const detailOpen = btnTexts.some((t) => t === '加入购物车' || t === '立即购买');
    const toasts = [...document.querySelectorAll('div,span')]
      .filter((e) => !e.children.length && e.textContent.trim())
      .map((e) => e.textContent.trim());
    return { detailOpen, hasSoldOutToast: toasts.includes('已售尽') };
  });
  if (shot) await page.screenshot({ path: `${OUT}/${shot}.png` });
  console.log(`${name}: 详情打开=${res.detailOpen}  toast已售尽=${res.hasSoldOutToast}`);
  await page.close();
};

await run('希腊酸奶杯');
await run('冷萃燕麦拿铁', 'noclick');
await browser.close();
