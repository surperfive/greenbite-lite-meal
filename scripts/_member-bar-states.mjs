/** 首页身份条：两种状态（已登录 / 未登录）+ 点击行为验证 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';
const OUT = 'scripts/_shots';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 3 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.waitForTimeout(600);

const settle = async () => {
  await page.waitForTimeout(1200);
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
  await page.waitForTimeout(300);
};

const shotBar = async (name) => {
  const clip = await page.evaluate(() => {
    const b = document.getElementById('home-member-bar').getBoundingClientRect();
    return { x: Math.max(0, b.x - 6), y: Math.max(0, b.y - 6), width: b.width + 12, height: b.height + 12 };
  });
  await page.screenshot({ path: `${OUT}/${name}.png`, clip });
  return page.evaluate(() => {
    const bar = document.getElementById('home-member-bar');
    const b = bar.getBoundingClientRect();
    return { h: +b.height.toFixed(2), w: +b.width.toFixed(2), text: bar.innerText.replace(/\n/g, ' | ') };
  });
};

// ── 1. 已登录 ──
await page.click('#nav-tab-home');
await settle();
const logged = await shotBar('member-bar-logged');
console.log('已登录：', JSON.stringify(logged));

// ── 2. 退出登录 → 未登录 ──
await page.click('#nav-tab-me');
await page.waitForTimeout(900);
await page.getByText('退出登录 / 切换账号').click();
await page.waitForTimeout(700);
await page.click('#nav-tab-home');
await settle();
const guest = await shotBar('member-bar-guest');
console.log('未登录：', JSON.stringify(guest));

// ── 3. 未登录点击 → 应拉起登录弹窗 ──
await page.click('#home-member-bar');
await page.waitForTimeout(800);
const loginModal = await page.evaluate(() => {
  const txt = document.body.innerText;
  return {
    hasLoginWord: /登录|手机号|验证码/.test(txt),
    // 找遮罩层
    overlays: [...document.querySelectorAll('div')].filter((d) => {
      const st = getComputedStyle(d);
      return st.position === 'fixed' && parseFloat(st.zIndex || '0') >= 40 && d.getBoundingClientRect().width > 200;
    }).length,
  };
});
console.log('点击未登录条 →', JSON.stringify(loginModal));
await page.screenshot({ path: `${OUT}/member-bar-login-modal.png` });
console.log('ok');
await browser.close();
