import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 1 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#nav-tab-home', { timeout: 20000 });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(2000);
await page.click('#nav-tab-orders');
await page.waitForTimeout(1400);
const m = await page.evaluate(() => {
  const cap = document.getElementById('mp-capsule').getBoundingClientRect();
  const inp = document.querySelector('input[placeholder*="搜索菜品名称"]').getBoundingClientRect();
  const bar = document.querySelector('input[placeholder*="搜索菜品名称"]').closest('div.flex.items-center.gap-2');
  const rowR = bar.getBoundingClientRect();
  // 搜索按钮 = 这一行最后一个 button
  const btns = bar.querySelectorAll('button');
  const searchBtn = btns[btns.length - 1].getBoundingClientRect();
  const sticky = document.querySelector('input[placeholder*="搜索菜品名称"]').closest('.sticky');
  const st = sticky.getBoundingClientRect();
  return {
    capBottom: +cap.bottom.toFixed(1),
    stickyTop: +st.top.toFixed(1),
    stickyH: +st.height.toFixed(1),
    inputTop: +inp.top.toFixed(1),
    rowTop: +rowR.top.toFixed(1),
    rowBottom: +rowR.bottom.toFixed(1),
    searchBtnTop: +searchBtn.top.toFixed(1),
    searchBtnRight: +searchBtn.right.toFixed(1),
    gapCapToRow: +(rowR.top - cap.bottom).toFixed(1),
  };
});
console.log(JSON.stringify(m, null, 2));
await browser.close();
