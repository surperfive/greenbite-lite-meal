import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
const dump = async (tab, label) => {
  await page.click(`#nav-tab-${tab}`);
  await page.waitForTimeout(900);
  const rows = await page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll('button,div,span')) {
      const cs = getComputedStyle(el);
      const b = el.getBoundingClientRect();
      if (b.height < 12 || b.height > 60 || b.width < 18) continue;
      const rad = Math.min(...[cs.borderTopLeftRadius, cs.borderTopRightRadius, cs.borderBottomLeftRadius, cs.borderBottomRightRadius].map(parseFloat));
      if (rad < Math.max(6, b.height * 0.4)) continue;
      const t = el.textContent.replace(/\s+/g, ' ').trim();
      if (!t || t.length > 14) continue;
      out.push({ t, y: +b.top.toFixed(1), h: +b.height.toFixed(2), cx: +(b.left + b.width / 2).toFixed(1) });
    }
    // 同一水平行（y 相近）里高度不一致的
    out.sort((a, b) => a.y - b.y || a.cx - b.cx);
    return out;
  });
  console.log(`\n=== ${label} ===`);
  let i = 0;
  while (i < rows.length) {
    const row = [rows[i]];
    let j = i + 1;
    while (j < rows.length && Math.abs(rows[j].y - rows[i].y) < 3) { row.push(rows[j]); j++; }
    if (row.length > 1) {
      const hs = [...new Set(row.map((r) => r.h))];
      const flag = hs.length > 1 ? '  ⚠️ 高度不一' : '';
      console.log(row.map((r) => `${r.t}(${r.h})`).join(' | ') + flag);
    }
    i = j;
  }
};
await dump('orders', '订单页');
await dump('menu', '点餐页');
await browser.close();
