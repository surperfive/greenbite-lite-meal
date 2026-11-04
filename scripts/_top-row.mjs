import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.click('#nav-tab-menu');
await page.waitForTimeout(900);
const r = await page.evaluate(() => {
  const out = {};
  for (const el of document.querySelectorAll('div')) {
    const t = el.textContent.replace(/\s+/g, '');
    const b = el.getBoundingClientRect();
    if (t === '外卖自提' && b.height < 60) out.switcher = { h: +b.height.toFixed(2), y: +b.top.toFixed(1) };
    if (t.includes('搜索轻食名称、热量数值') && b.height < 60 && !out.search) out.search = { h: +b.height.toFixed(2), y: +b.top.toFixed(1) };
  }
  // 搜索按钮
  for (const el of document.querySelectorAll('button,span')) {
    if (el.textContent.trim() === '搜索') {
      const b = el.getBoundingClientRect();
      if (b.height < 40) { out.searchBtn = { h: +b.height.toFixed(2), y: +b.top.toFixed(1) }; break; }
    }
  }
  return out;
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
