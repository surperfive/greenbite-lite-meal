/**
 * 拍真实页面（含背景/相邻元素），裁出若干「胶囊行」，放大供目视。
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';

const OUT = 'scripts/_shots/rows';
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const DPR = 3;

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: DPR });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });

const grab = async (name, finder) => {
  const box = await page.evaluate(finder);
  if (!box) {
    console.log('miss', name);
    return null;
  }
  const file = `${name}.png`;
  await page.screenshot({
    path: `${OUT}/${file}`,
    clip: { x: box.x, y: box.y, width: box.w, height: box.h },
  });
  console.log(name, JSON.stringify(box));
  return file;
};

const boxOf = (sel, padY = 8, padX = 6) => `(() => {
  const el = document.querySelector(${JSON.stringify(sel)});
  if (!el) return null;
  const r = el.getBoundingClientRect();
  const sc = document.querySelector('.overflow-y-auto');
  const st = sc ? sc.scrollTop : 0;
  const sr = sc ? sc.getBoundingClientRect() : { top: 0, left: 0 };
  return { x: Math.max(0, r.left - ${padX}), y: Math.max(0, r.top - ${padY}),
           w: r.width + ${padX * 2}, h: r.height + ${padY * 2} };
})()`;

// 点餐页：模式切换 + 筛选行
await page.click('#nav-tab-menu');
await page.waitForTimeout(900);
const files = [];

// 用文本定位：找到包含「外卖」和「自提」的切换器容器
const switcher = await page.evaluate(() => {
  for (const el of document.querySelectorAll('div')) {
    const t = el.textContent.replace(/\s+/g, '');
    if (t === '外卖自提' && el.getBoundingClientRect().height < 60 && el.getBoundingClientRect().height > 20) {
      const r = el.getBoundingClientRect();
      return { x: Math.max(0, r.left - 6), y: Math.max(0, r.top - 10), w: r.width + 12, h: r.height + 20 };
    }
  }
  return null;
});
console.log('DBG switcher', JSON.stringify(switcher));
if (switcher && typeof switcher.w === 'number') {
  await page.screenshot({ path: `${OUT}/row-switcher.png`, clip: { x: switcher.x, y: switcher.y, width: switcher.w, height: switcher.h } });
  files.push('row-switcher.png');
  console.log('switcher', switcher);
}

const filters = await page.evaluate(() => {
  for (const el of document.querySelectorAll('div')) {
    const t = el.textContent.replace(/\s+/g, '');
    if (t.includes('≤250大卡') && t.includes('250-400大卡') && el.getBoundingClientRect().height < 60) {
      const r = el.getBoundingClientRect();
      return { x: Math.max(0, r.left - 4), y: Math.max(0, r.top - 10), w: Math.min(r.width + 8, 430), h: r.height + 20 };
    }
  }
  return null;
});
if (filters) {
  await page.screenshot({ path: `${OUT}/row-filters.png`, clip: { x: filters.x, y: filters.y, width: filters.w, height: filters.h } });
  files.push('row-filters.png');
  console.log('filters', filters);
}

// 订单页：状态 tab 行
await page.click('#nav-tab-orders');
await page.waitForTimeout(900);
const tabs = await page.evaluate(() => {
  for (const el of document.querySelectorAll('div')) {
    const t = el.textContent.replace(/\s+/g, '');
    if (t.includes('进行中') && t.includes('已完成') && el.getBoundingClientRect().height < 70 && el.getBoundingClientRect().height > 24) {
      const r = el.getBoundingClientRect();
      return { x: Math.max(0, r.left - 6), y: Math.max(0, r.top - 10), w: Math.min(r.width + 12, 430), h: r.height + 20 };
    }
  }
  return null;
});
if (tabs) {
  await page.screenshot({ path: `${OUT}/row-tabs.png`, clip: { x: tabs.x, y: tabs.y, width: tabs.w, height: tabs.h } });
  files.push('row-tabs.png');
  console.log('tabs', tabs);
}

// 订单页：操作按钮行（去评价 / 再来一单 / 发票）
const acts = await page.evaluate(() => {
  const el = [...document.querySelectorAll('div')].find((e) => {
    const t = e.textContent.replace(/\s+/g, '');
    const r = e.getBoundingClientRect();
    return (t.includes('去评价') || t.includes('再来一单') || t.includes('发票')) && r.height < 80 && r.height > 20 && r.width > 200;
  });
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: Math.max(0, r.left - 4), y: Math.max(0, r.top - 8), w: Math.min(r.width + 8, 430), h: r.height + 16 };
});
if (acts) {
  await page.screenshot({ path: `${OUT}/row-actions.png`, clip: { x: acts.x, y: acts.y, width: acts.w, height: acts.h } });
  files.push('row-actions.png');
  console.log('actions', acts);
}

// 首页：身份条
await page.click('#nav-tab-home');
await page.waitForTimeout(900);
const bar = await page.evaluate(() => {
  const el = [...document.querySelectorAll('div')].find((e) => {
    const t = e.textContent.replace(/\s+/g, '');
    const r = e.getBoundingClientRect();
    return t.includes('立即登录') && r.height > 30 && r.height < 60;
  });
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: Math.max(0, r.left - 4), y: Math.max(0, r.top - 8), w: Math.min(r.width + 8, 430), h: r.height + 16 };
});
if (bar) {
  await page.screenshot({ path: `${OUT}/row-memberbar.png`, clip: { x: bar.x, y: bar.y, width: bar.w, height: bar.h } });
  files.push('row-memberbar.png');
  console.log('memberbar', bar);
}

console.log('files', files.join(','));
await browser.close();
