/** 身份条：改前(隐藏) / 改后(登录态) / 改后(未登录) 三联，并验证点击跳转 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';
const OUT = 'scripts/_shots';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.waitForTimeout(600);

const settle = async () => {
  await page.waitForTimeout(1000);
  await page
    .waitForFunction(
      () => {
        const bar = document.getElementById('home-member-bar');
        if (!bar) return false;
        let el = bar;
        while (el) {
          if (parseFloat(getComputedStyle(el).opacity) < 0.999) return false;
          el = el.parentElement;
        }
        return true;
      },
      null,
      { timeout: 10000 }
    )
    .catch(() => {});
  await page.waitForTimeout(250);
};

/** 以 **hero 底边** 为锚截「海报底 150px + 下方 150px」——
    改前（bar 被 display:none）和改后必须用同一个锚，否则两张图内容错位。 */
const clipTop = async () => {
  return page.evaluate(() => {
    const bar = document.getElementById('home-member-bar');
    const hero = bar.parentElement.previousElementSibling; // BannerSlider 根节点
    const r = hero.getBoundingClientRect();
    return {
      x: r.x,
      y: Math.max(0, r.bottom - 150),
      width: r.width,
      height: 300,
    };
  });
};

await page.click('#nav-tab-home');
await settle();

// ── A. 改前：只把这条栏从布局里拿掉（display:none），源码不动 ──
await page.evaluate(() => {
  const bar = document.getElementById('home-member-bar');
  bar.style.display = 'none';
});
await page.waitForTimeout(300);
let c = await clipTop();
await page.screenshot({ path: `${OUT}/mb-before.png`, clip: c });

// ── B. 改后（登录态） ──
await page.evaluate(() => {
  document.getElementById('home-member-bar').style.display = '';
});
await page.waitForTimeout(300);
c = await clipTop();
await page.screenshot({ path: `${OUT}/mb-after.png`, clip: c });

// ── C. 点击已登录条 → 应进「我的」页 ──
await page.click('#home-member-bar');
await page.waitForTimeout(900);
const tabAfterClick = await page.evaluate(() => {
  const me = document.getElementById('nav-tab-me');
  const home = document.getElementById('nav-tab-home');
  return {
    meActive: me ? getComputedStyle(me).color : null,
    homeActive: home ? getComputedStyle(home).color : null,
    hasMemberText: /会员中心|我的订单|我的功能/.test(document.body.innerText),
  };
});
console.log('点击已登录条 →', JSON.stringify(tabAfterClick));

// ── D. 退出登录 → 未登录态 ──
await page.getByText('退出登录 / 切换账号').click();
await page.waitForTimeout(700);
await page.click('#nav-tab-home');
await settle();
c = await clipTop();
await page.screenshot({ path: `${OUT}/mb-guest.png`, clip: c });

console.log('ok');
await browser.close();
