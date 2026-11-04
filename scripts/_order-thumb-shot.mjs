/** 订单卡菜品缩略图截图：多品（两个独立框）+ 单品（单框）对照 */
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
await page.click('#nav-tab-orders');
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 15000 }).catch(() => {});
await page.waitForTimeout(1000);

const info = await page.evaluate(() => {
  // 缩略图容器：订单卡里带 border-slate-200 的 84 宽块
  const nodes = [...document.querySelectorAll('div')].filter((d) => {
    const r = d.getBoundingClientRect();
    return Math.abs(r.width - 84) < 1.5 && Math.abs(r.height - 62) < 1.5;
  });
  return nodes.map((d) => {
    const r = d.getBoundingClientRect();
    const kids = [...d.children].map((c) => {
      const cr = c.getBoundingClientRect();
      return { w: +cr.width.toFixed(1), h: +cr.height.toFixed(1) };
    });
    return { w: +r.width.toFixed(1), h: +r.height.toFixed(1), x: +r.x.toFixed(1), y: +r.y.toFixed(1), kids };
  });
});
console.log(JSON.stringify(info, null, 1));

// 截第一张（多品）
const first = await page.evaluate(() => {
  const d = [...document.querySelectorAll('div')].find((d) => {
    const r = d.getBoundingClientRect();
    return Math.abs(r.width - 84) < 1.5 && Math.abs(r.height - 62) < 1.5;
  });
  const r = d.getBoundingClientRect();
  return { x: r.x - 8, y: r.y - 8, width: r.width + 16, height: r.height + 16 };
});
await page.screenshot({ path: `${OUT}/order-thumb-multi.png`, clip: first });
// 单品（第二个 84×62）
const second = await page.evaluate(() => {
  const all = [...document.querySelectorAll('div')].filter((d) => {
    const r = d.getBoundingClientRect();
    return Math.abs(r.width - 84) < 1.5 && Math.abs(r.height - 62) < 1.5;
  });
  const r = all[all.length - 1].getBoundingClientRect();
  return { x: r.x - 8, y: r.y - 8, width: r.width + 16, height: r.height + 16 };
});
await page.screenshot({ path: `${OUT}/order-thumb-single.png`, clip: second });
await browser.close();
console.log('ok');
