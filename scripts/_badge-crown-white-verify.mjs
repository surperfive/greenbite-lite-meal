import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 4 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 30000 }).catch(() => {});
await page.waitForFunction(() => {
  const s = document.getElementById('app-page-stage');
  return s && getComputedStyle(s).opacity === '1';
}, { timeout: 30000 });
await page.click('#nav-tab-gacha');
await page.waitForFunction(() => {
  const s = document.getElementById('app-page-stage');
  return s && getComputedStyle(s).opacity === '1';
}, { timeout: 30000 });
await page.waitForTimeout(1500);

const g = await page.evaluate(() => {
  const r = (id) => {
    const e = document.getElementById(id).getBoundingClientRect();
    return { x: e.x, y: e.y, w: e.width, h: e.height };
  };
  return { bubble: r('badge-bubble'), crown: r('badge-crown'), text: r('txt-discount') };
});
console.log('BOXES', JSON.stringify(g));

// 夹紧在气泡内部：上下各取 18%~82%（避开白胶囊与圆角），左右用元素自身范围
const top = g.bubble.y + g.bubble.h * 0.18;
const hgt = g.bubble.h * 0.64;
const clipCrown = { x: g.crown.x + 1, y: top, width: g.crown.w - 2, height: hgt };
const clipText = { x: g.text.x + 2, y: top, width: g.text.w - 4, height: hgt };
await page.screenshot({ path: 'scripts/_shots/w-crown.png', clip: clipCrown });
await page.screenshot({ path: 'scripts/_shots/w-text.png', clip: clipText });
await page.screenshot({ path: 'scripts/_shots/w-badge-full.png', clip: { x: g.bubble.x - 20, y: g.bubble.y - 12, width: g.bubble.w + 40, height: g.bubble.h + 30 } });

// 顺带把最终计算样式也 dump 出来，防止被其它规则覆盖
const cs = await page.evaluate(() => {
  const p = document.querySelector('#badge-crown path');
  return {
    fill: p.getAttribute('fill'),
    stroke: p.getAttribute('stroke'),
    computedFill: getComputedStyle(p).fill,
    computedStroke: getComputedStyle(p).stroke,
    textFill: getComputedStyle(document.getElementById('txt-discount')).fill,
    transform: document.getElementById('badge-crown').getAttribute('transform'),
  };
});
console.log('STYLE', JSON.stringify(cs));
await browser.close();
