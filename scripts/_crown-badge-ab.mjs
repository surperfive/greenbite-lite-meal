/** 皇冠在徽章圆里的对齐：bbox 居中 vs 质心对齐（改前用 JS 回滚 transform，源码不动） */
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

const clip = await page.evaluate(() => {
  const bar = document.getElementById('home-member-bar');
  const img = bar.querySelector('img');
  const badge = img.parentElement.parentElement.querySelector('svg');
  const b = badge.getBoundingClientRect();
  return { x: b.x - 3, y: b.y - 3, width: b.width + 6, height: b.height + 6 };
});

// 改后：质心对齐
await page.screenshot({ path: `${OUT}/crown-after.png`, clip });

// 改前：去掉 translate（回到 bbox 居中）
await page.evaluate(() => {
  const bar = document.getElementById('home-member-bar');
  const img = bar.querySelector('img');
  const badge = img.parentElement.parentElement.querySelector('svg');
  badge.querySelector('svg').style.transform = 'none';
});
await page.waitForTimeout(200);
await page.screenshot({ path: `${OUT}/crown-before.png`, clip });

console.log('ok');
await browser.close();
