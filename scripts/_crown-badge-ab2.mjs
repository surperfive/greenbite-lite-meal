/**
 * 会员皇冠徽章 A/B：**bbox 居中（现状）** vs **质心对齐（上移 1.81 单位）**。
 *
 * 背景：皇冠是「底宽顶尖 + 厚底边」的多边形，矢量质心在 y=15.81，
 * 比 bbox 中心（y=14）低 1.81 个 viewBox 单位 = 0.9075 css px（14px 徽章上）。
 * 按 bbox 居中，视觉重量压在下方 → 看起来"沉"。这正是抽卡页「9折限时」
 * 徽章踩过的坑，那边也是用质心对齐修的。
 *
 * 本脚本不改源码：B 方案只是在 DOM 上给 path 加 `transform="translate(0,-1.81)"`，
 * 方便并排看。定稿后再写回源码。
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';
const OUT = 'scripts/_shots';
fs.mkdirSync(OUT, { recursive: true });

const SHIFT = 1.8149;   // 矢量质心 15.8149 − bbox 中心 14

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 8 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.waitForTimeout(600);
await page.click('#nav-tab-home');
await page.waitForSelector('#home-member-bar', { timeout: 15000 });
await page.waitForTimeout(1600);

const prep = async () => page.evaluate(() => {
  const bar = document.getElementById('home-member-bar');
  const img = bar.querySelector('img');
  const avatarWrap = img.closest('span.block');
  const badge = avatarWrap.parentElement.querySelector('svg');
  avatarWrap.style.visibility = 'hidden';
  const b = badge.getBoundingClientRect();
  return { x: b.x - 4, y: b.y - 4, width: b.width + 8, height: b.height + 8 };
});

const clip = await prep();
await page.waitForTimeout(120);
await page.screenshot({ path: `${OUT}/crown-ab-A-bbox.png`, clip });

// B：质心对齐
await page.evaluate((s) => {
  const bar = document.getElementById('home-member-bar');
  const img = bar.querySelector('img');
  const badge = img.closest('span.block').parentElement.querySelector('svg');
  badge.querySelector('path').setAttribute('transform', `translate(0,${-s})`);
}, SHIFT);
await page.waitForTimeout(120);
await page.screenshot({ path: `${OUT}/crown-ab-B-centroid.png`, clip });

// 还原，给一张"真实上下文"图（不隐藏头像），两种状态各一张
await page.evaluate(() => {
  const bar = document.getElementById('home-member-bar');
  const img = bar.querySelector('img');
  const badge = img.closest('span.block').parentElement.querySelector('svg');
  badge.querySelector('path').removeAttribute('transform');
  img.closest('span.block').style.visibility = '';
});
await page.waitForTimeout(120);
const ctxClip = await page.evaluate(() => {
  const bar = document.getElementById('home-member-bar');
  const b = bar.getBoundingClientRect();
  return { x: b.x, y: b.y, width: 120, height: b.height };
});
await page.screenshot({ path: `${OUT}/crown-ctx-A.png`, clip: ctxClip });
await page.evaluate((s) => {
  const bar = document.getElementById('home-member-bar');
  const img = bar.querySelector('img');
  const badge = img.closest('span.block').parentElement.querySelector('svg');
  badge.querySelector('path').setAttribute('transform', `translate(0,${-s})`);
}, SHIFT);
await page.waitForTimeout(120);
await page.screenshot({ path: `${OUT}/crown-ctx-B.png`, clip: ctxClip });

console.log('ok  shift =', SHIFT);
await browser.close();
