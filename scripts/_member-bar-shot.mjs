/** 首页身份条 4× 局部截图 + DOM 几何实测 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';
const OUT = 'scripts/_shots';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 4 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.waitForTimeout(600);
await page.click('#nav-tab-home');
await page.waitForSelector('#home-member-bar', { timeout: 15000 });
await page.waitForTimeout(1600);
// 等首页切页的入场动画彻底结束（motion 的 opacity/transform 中间态会让整张图发白）
await page.waitForFunction(() => {
  const bar = document.getElementById('home-member-bar');
  if (!bar) return false;
  let el = bar;
  while (el) {
    const st = getComputedStyle(el);
    if (parseFloat(st.opacity) < 0.999) return false;
    el = el.parentElement;
  }
  return true;
}, null, { timeout: 10000 }).catch(() => {});
await page.waitForTimeout(400);

const geo = await page.evaluate(() => {
  const bar = document.getElementById('home-member-bar');
  const pick = (el) => {
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return {
      x: +b.x.toFixed(2),
      y: +b.y.toFixed(2),
      w: +b.width.toFixed(2),
      h: +b.height.toFixed(2),
    };
  };
  const img = bar.querySelector('img');
  const pill = [...bar.querySelectorAll('span')].find((s) => s.textContent === '黄金会员 LV.2');
  const prog = [...bar.querySelectorAll('span')].find((s) => s.className.includes('h-[5px]'));
  return {
    bar: pick(bar),
    avatar: pick(img),
    levelPill: pick(pill),
    progress: pick(prog),
    barStyle: {
      bg: getComputedStyle(bar).backgroundImage.slice(0, 90),
      radius: getComputedStyle(bar).borderRadius,
    },
  };
});
console.log(JSON.stringify(geo, null, 2));

const clip = await page.evaluate(() => {
  const b = document.getElementById('home-member-bar').getBoundingClientRect();
  return { x: Math.max(0, b.x - 6), y: Math.max(0, b.y - 6), width: b.width + 12, height: b.height + 12 };
});
await page.screenshot({ path: `${OUT}/member-bar-4x.png`, clip });
console.log('ok');
await browser.close();
