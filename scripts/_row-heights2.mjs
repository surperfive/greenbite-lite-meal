import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });

const scan = () => {
  const out = [];
  for (const el of document.querySelectorAll('div,span,button,a,li,label')) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const b = el.getBoundingClientRect();
    if (b.height < 11 || b.height > 56 || b.width < 14 || b.width > 340) continue;
    if (b.top < 0 || b.bottom > innerHeight) continue;
    const rad = Math.min(...[cs.borderTopLeftRadius, cs.borderTopRightRadius, cs.borderBottomLeftRadius, cs.borderBottomRightRadius].map(parseFloat));
    if (rad < Math.max(5, b.height * 0.38)) continue;
    if (!el.textContent.trim()) continue;
    // 只取叶子胶囊：内部不能再有「也是胶囊」的元素
    let nested = false;
    for (const d of el.querySelectorAll('div,span,button,a,li,label')) {
      const dcs = getComputedStyle(d);
      const db = d.getBoundingClientRect();
      if (db.height < 10 || db.width < 14) continue;
      const dr = Math.min(...[dcs.borderTopLeftRadius, dcs.borderTopRightRadius, dcs.borderBottomLeftRadius, dcs.borderBottomRightRadius].map(parseFloat));
      if (dr >= Math.max(5, db.height * 0.38)) { nested = true; break; }
    }
    if (nested) continue;
    out.push({
      t: el.textContent.replace(/\s+/g, ' ').trim().slice(0, 12),
      y: +b.top.toFixed(1), h: +b.height.toFixed(2), cy: +(b.top + b.height / 2).toFixed(1),
      x: +b.left.toFixed(1), w: +b.width.toFixed(1),
      cls: (el.className || '').toString().slice(0, 150),
    });
  }
  return out;
};

const report = [];
for (const tab of ['home', 'menu', 'orders', 'me']) {
  await page.click(`#nav-tab-${tab}`);
  await page.waitForTimeout(900);
  for (const scroll of [0, 520, 1040, 1560]) {
    await page.evaluate((s) => { const sc = document.querySelector('.overflow-y-auto'); if (sc) sc.scrollTop = s; }, scroll);
    await page.waitForTimeout(330);
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
        if (spread >= 0.8) report.push({ tab, scroll, spread: +spread.toFixed(2), grp });
      }
      i = j;
    }
  }
}
report.sort((a, b) => b.spread - a.spread);
const seen = new Set();
for (const r of report) {
  const key = r.tab + '|' + r.grp.map((g) => g.t).join('|') + '|' + r.grp.map((g) => g.h).join('|');
  if (seen.has(key)) continue;
  seen.add(key);
  console.log(`\n[${r.tab}] 高度差 ${r.spread}px`);
  for (const g of r.grp) console.log(`   h=${String(g.h).padEnd(6)} «${g.t}»  ${g.cls.slice(0, 110)}`);
}
console.log(`\n共 ${seen.size} 组`);
await browser.close();
