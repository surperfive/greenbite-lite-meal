// 同行胶囊高度扫描（覆盖弹窗/详情页/确认订单页，_row-heights2.mjs 只扫了 4 个 tab）
import { chromium } from 'playwright';
import { BASE } from './_base.mjs';

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.waitForTimeout(1200);

const scan = () => {
  const out = [];
  for (const el of document.querySelectorAll('div,span,button,a,li,label')) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const b = el.getBoundingClientRect();
    if (b.height < 11 || b.height > 56 || b.width < 14 || b.width > 360) continue;
    if (b.top < 0 || b.bottom > innerHeight) continue;
    const rad = Math.min(...[cs.borderTopLeftRadius, cs.borderTopRightRadius, cs.borderBottomLeftRadius, cs.borderBottomRightRadius].map(parseFloat));
    if (rad < Math.max(5, b.height * 0.38)) continue;
    if (!el.textContent.trim()) continue;
    let nested = false;
    for (const d of el.querySelectorAll('div,span,button,a,li,label')) {
      const dcs = getComputedStyle(d);
      const db = d.getBoundingClientRect();
      if (db.height < 10 || db.width < 14) continue;
      const dr = Math.min(...[dcs.borderTopLeftRadius, dcs.borderTopRightRadius, dcs.borderBottomLeftRadius, dcs.borderBottomRightRadius].map(parseFloat));
      if (dr >= Math.max(5, db.height * 0.38)) { nested = true; break; }
    }
    if (nested) continue;
    out.push({ t: el.textContent.replace(/\s+/g, ' ').trim().slice(0, 12), h: +b.height.toFixed(2), cy: +(b.top + b.height / 2).toFixed(1), x: +b.left.toFixed(1), cls: (el.className || '').toString().slice(0, 120) });
  }
  return out;
};

const found = [];
const collect = async (label) => {
  for (const s of [0, 400, 800]) {
    await page.evaluate((v) => { const sc = document.querySelector('.overflow-y-auto'); if (sc) sc.scrollTop = v; }, s);
    await page.waitForTimeout(240);
    const rows = await page.evaluate(scan);
    rows.sort((a, b) => a.cy - b.cy || a.x - b.x);
    let i = 0;
    while (i < rows.length) {
      const grp = [rows[i]];
      let j = i + 1;
      while (j < rows.length && Math.abs(rows[j].cy - rows[i].cy) < 2.0) { grp.push(rows[j]); j++; }
      if (grp.length > 1) {
        const hs = grp.map((r) => r.h);
        const spread = Math.max(...hs) - Math.min(...hs);
        if (spread >= 0.8) found.push({ label, spread: +spread.toFixed(2), grp });
      }
      i = j;
    }
  }
};

// 1) 商品详情
await page.click('[data-dish-thumb="true"]', { force: true }).catch(() => {});
await page.waitForTimeout(900);
await collect('dish-detail');
await page.keyboard.press('Escape').catch(() => {});
await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((x) => /返回|关闭/.test(x.textContent));
  b?.click();
});
await page.waitForTimeout(700);

// 2) 搜索弹窗
await page.evaluate(() => {
  const el = [...document.querySelectorAll('div')].find((d) => /搜索轻食名称、热量数值/.test(d.textContent) && d.className.includes('rounded-full'));
  el?.click();
});
await page.waitForTimeout(900);
await collect('search-modal');
await page.keyboard.press('Escape').catch(() => {});
await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((x) => /取消|关闭/.test(x.textContent));
  b?.click();
});
await page.waitForTimeout(700);

// 3) 确认订单（订单页「再来一单」）
await page.click('#nav-tab-orders');
await page.waitForTimeout(800);
await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((x) => /再来一单/.test(x.textContent));
  b?.click();
});
await page.waitForTimeout(1200);
await collect('cart');

const seen = new Set();
for (const r of found) {
  const key = r.label + '|' + r.grp.map((g) => g.t + g.h).join('|');
  if (seen.has(key)) continue;
  seen.add(key);
  console.log(`\n[${r.label}] 高度差 ${r.spread}px`);
  for (const g of r.grp) console.log(`   h=${String(g.h).padEnd(6)} «${g.t}»  ${g.cls.slice(0, 100)}`);
}
console.log(`\n共 ${seen.size} 组`);
await browser.close();
