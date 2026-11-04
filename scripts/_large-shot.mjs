/**
 * 详情页 hero「标准份 vs 大份」六道菜逐一抓图。
 * 大份现在换成了实拍抠图，用来核对：尺寸是否协调、白边是否干净、切换是否有闪。
 * 用法：node scripts/_large-shot.mjs
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { BASE } from './_base.mjs';

const OUT = 'scripts/_large';
mkdirSync(OUT, { recursive: true });

const DISHES = ['牛油果鸡胸沙拉', '金枪鱼三明治', '羽衣甘蓝酸奶昔', '日式照烧鸡肉锅', '冷萃燕麦拿铁', '希腊酸奶杯'];

const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 2 });
await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
const page = await ctx.newPage();

const clearSplash = async () => {
  for (let i = 0; i < 10; i++) {
    const visible = await page.evaluate(() => {
      const b = [...document.querySelectorAll('button')].find((x) => x.textContent?.trim() === '跳过');
      if (!b) return false;
      const r = b.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && getComputedStyle(b).visibility !== 'hidden';
    });
    if (!visible) return true;
    await page.evaluate(() => {
      const b = [...document.querySelectorAll('button')].find((x) => x.textContent?.trim() === '跳过');
      b?.click();
    });
    await page.waitForTimeout(350);
  }
  return false;
};

await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#nav-tab-menu', { timeout: 60000 });
await page.waitForTimeout(3200);
await clearSplash();
await page.waitForTimeout(600);

for (let i = 0; i < DISHES.length; i++) {
  const name = DISHES[i];
  await page.locator('div.cursor-pointer', { hasText: name }).first().click({ timeout: 20000 });
  await page.waitForTimeout(1200);
  await clearSplash();
  await page.waitForTimeout(500);

  const hero = { x: 0, y: 0, width: 420, height: 232 };
  await page.screenshot({ path: `${OUT}/${i}-a-regular.png`, clip: hero, timeout: 60000 });

  const clicked = await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => /超大(碗|杯)/.test(x.textContent || ''));
    b?.click();
    return !!b;
  });
  await page.waitForTimeout(900);
  await clearSplash();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/${i}-b-large.png`, clip: hero, timeout: 60000 });

  const loaded = await page.evaluate(() => {
    const img = [...document.querySelectorAll('img')].find((x) => x.src.includes('/dishes/large/'));
    return img ? { src: img.src.split('/').pop(), w: img.naturalWidth, h: img.naturalHeight, rect: img.getBoundingClientRect().toJSON() } : null;
  });
  console.log(i, name, 'largeBtn', clicked, JSON.stringify(loaded));

  await page.locator('button[aria-label="返回"]').click();
  await page.waitForTimeout(700);
}

await browser.close();
console.log('done ->', OUT);
