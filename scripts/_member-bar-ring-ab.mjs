/** 身份条「有黑描边 / 无黑描边」A/B —— 只在最坏情况（第三张绿底拿铁海报）上比。
 *  源码已是「无描边」；有描边那张是把 ring 临时写回 inline style，不动源码。 */
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
await page.click('#nav-tab-home');
await page.waitForSelector('#home-member-bar', { timeout: 15000 });
await page.waitForTimeout(1600);

await page.click('[aria-label="切换到第 3 张轮播图"]');
await page.waitForFunction(() => {
  const im = [...document.querySelectorAll('img')].filter((i) => /hero-poster/.test(i.currentSrc || i.src))[2];
  if (!im) return false;
  const r = im.getBoundingClientRect();
  return Math.abs(r.width - 410) < 0.6 && r.left > -1 && r.left < 40;
}, null, { timeout: 8000 });
await page.waitForTimeout(300);

const clip = await page.evaluate(() => {
  const b = document.getElementById('home-member-bar').getBoundingClientRect();
  return { x: b.x - 6, y: b.top - 60, width: b.width + 12, height: b.height + 70 };
});

// A：无描边（源码现状）
await page.screenshot({ path: `${OUT}/mb-ring-A-off.png`, clip });

// B：临时写回 1.5px 黑描边
await page.evaluate(() => {
  const el = document.getElementById('home-member-bar');
  el.style.boxShadow = '0 0 0 1.5px #070906, 0 4px 16px rgba(0,0,0,0.10)';
});
await page.waitForTimeout(150);
await page.screenshot({ path: `${OUT}/mb-ring-B-on.png`, clip });

// 顺带量一下第三张海报底色，判断「融不融」的客观依据
const px = await page.evaluate(() => {
  const bar = document.getElementById('home-member-bar');
  const r = bar.getBoundingClientRect();
  return { cardBg: getComputedStyle(bar).backgroundColor, top: r.top, left: r.left };
});
console.log(JSON.stringify(px));
console.log('ok');
await browser.close();
