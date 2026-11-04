/**
 * 会员皇冠徽章：**隔离测量**版。
 *
 * 为什么不能直接量 `_crown-badge-shot.mjs` 的图：
 * 徽章压在头像右下角，裁出来的 3px 余量里含着头像（mascot-avatar.svg 自带黑描边）。
 * 头像的黑描边会和徽章的描边环**连成同一个连通域**（8× 下还连着投影），
 * 于是「描边环 bbox」直接吃到画面边缘 —— 圆心、描边厚度、内半径全部错，
 * 上次就这样量出「描边 4.75 css / 内半径 3.75」这种荒谬值。
 *
 * 解法：把头像那层 `span.block.rounded-full` 临时 `visibility:hidden`，
 * 徽章就孤立地站在青柠卡面上（白圆 + 黑环 + 黑皇冠），连通域干净。
 * ⚠️ 只改 DOM 的 visibility，**不动源码**，也不影响布局（visibility 保留占位）。
 * ⚠️ 徽章自身的位置由 `absolute -bottom-[2px] -right-[2px]` 相对 `span.relative` 决定，
 *    头像隐藏后 `span.relative` 的尺寸仍由头像撑着（visibility 不塌陷），位置不变。
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';
const OUT = 'scripts/_shots';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 8 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.waitForTimeout(600);
await page.click('#nav-tab-home');
await page.waitForSelector('#home-member-bar', { timeout: 15000 });
await page.waitForTimeout(1600);

const info = await page.evaluate(() => {
  const bar = document.getElementById('home-member-bar');
  const img = bar.querySelector('img');
  const avatarWrap = img.closest('span.block');       // 头像白圈（含 img）
  const badge = avatarWrap.parentElement.querySelector('svg');
  // 隔离：只藏头像，徽章留在原地
  avatarWrap.style.visibility = 'hidden';
  const b = badge.getBoundingClientRect();
  return {
    badge: { x: +b.x.toFixed(3), y: +b.y.toFixed(3), w: +b.width.toFixed(3), h: +b.height.toFixed(3) },
  };
});
console.log(JSON.stringify(info, null, 2));
await page.waitForTimeout(120);

const clip = await page.evaluate(() => {
  const bar = document.getElementById('home-member-bar');
  const img = bar.querySelector('img');
  const badge = img.closest('span.block').parentElement.querySelector('svg');
  const b = badge.getBoundingClientRect();
  return { x: b.x - 4, y: b.y - 4, width: b.width + 8, height: b.height + 8 };
});
await page.screenshot({ path: `${OUT}/crown-badge-iso-8x.png`, clip });
console.log('ok');
await browser.close();
