/** 把全站红 #E60012 换成玫红 #FC259B 之后的效果巡检。
 *
 *  ⚠️ 底部导航只有 home / menu / gacha / orders / me 五个 tab（**没有 cart**，
 *     购物车是浮动件打开的子页面）—— 写成 `#nav-tab-cart` 会让 page.click 等满
 *     默认 30s 超时才被 catch 掉，几个叠加就把脚本拖到被 SIGTERM。
 *  ⚠️ 所有 click 都显式给 timeout，别依赖默认值。
 *  ⚠️ 切页是 motion 动画，截前沿祖先链确认 opacity ≥ 0.999，否则图会发白。
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';
const OUT = 'scripts/_shots/color';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
await page.route('**/fonts.googleapis.com/**', (r) => r.abort());
await page.route('**/fonts.gstatic.com/**', (r) => r.abort());
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.waitForTimeout(900);

const settled = async () => {
  await page.waitForFunction(() => {
    const walk = (e) => {
      while (e && e !== document.documentElement) {
        if (parseFloat(getComputedStyle(e).opacity) < 0.999) return false;
        e = e.parentElement;
      }
      return true;
    };
    return walk(document.body);
  }, null, { timeout: 6000 }).catch(() => {});
  await page.waitForTimeout(400);
};
const shot = async (name) => {
  await settled();
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log(name, 'ok');
};
const tab = async (id, wait = 1500) => {
  await page.click(`#nav-tab-${id}`, { timeout: 4000 }).catch(() => {});
  await page.waitForTimeout(wait);
};

await tab('home', 1600); await shot('home');
await tab('menu', 1600); await shot('menu');

// 详情页
const card = page.locator('text=牛油果鸡胸沙拉').first();
await card.evaluate((el) => el.scrollIntoView({ block: 'center' })).catch(() => {});
await page.waitForTimeout(400);
await card.click({ timeout: 4000 }).catch(() => {});
await page.waitForSelector('h1', { timeout: 6000 }).catch(() => {});
await page.waitForTimeout(1400);
await shot('detail');
await page.keyboard.press('Escape').catch(() => {});
await page.waitForTimeout(800);

await tab('orders', 1600); await shot('orders');
await tab('gacha', 1800); await shot('gacha');
await tab('me', 1500); await shot('me');

console.log('done');
await browser.close();
