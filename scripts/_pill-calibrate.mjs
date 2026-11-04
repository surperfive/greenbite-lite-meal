/**
 * 目视标定：把同一颗胶囊复制 5 份，分别对文字施加 -2/-1/0/+1/+2 px 位移，
 * 并排排在一张图里，每份画一条红色水平中心线。由人眼判定哪一档居中。
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';

const OUT = 'scripts/_shots/calib';
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const TARGETS = (process.env.TARGETS || '外卖|自提|到店自取|全部(2)|≤250大卡|首单立减|高蛋白|进行中(1)|去评价|查看更多|立省¥35|立即登录|加入购物车|配送中|全部').split('|');
const SHIFTS = [-2, -1, 0, 1, 2];

const FIND = (names) => {
  const out = [];
  const norm = (s) => s.replace(/\s+/g, ' ').trim();
  for (const el of document.querySelectorAll('div,span,button,a,li,label,strong,em,p')) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) continue;
    const b = el.getBoundingClientRect();
    if (b.width < 18 || b.height < 12 || b.height > 60) continue;
    if (b.top < 0 || b.bottom > innerHeight) continue;
    const radii = [cs.borderTopLeftRadius, cs.borderTopRightRadius, cs.borderBottomLeftRadius, cs.borderBottomRightRadius].map(parseFloat);
    if (Math.min(...radii) < Math.max(6, b.height * 0.4)) continue;
    const t = norm(el.textContent);
    if (!t) continue;
    if (!names.some((n) => t === n || t.startsWith(n))) continue;
    if (out.some((o) => o.t === t && Math.abs(o.h - b.height) < 1)) continue;
    out.push({ t, h: +b.height.toFixed(1), fs: parseFloat(cs.fontSize) });
    el.setAttribute('data-calib', String(out.length - 1));
  }
  return out;
};

const BUILD = ({ idx, shifts }) => {
  const el = document.querySelector(`[data-calib="${idx}"]`);
  if (!el) return null;
  const stage = document.getElementById('calib-stage');
  stage.innerHTML = '';
  const made = [];
  for (const sh of shifts) {
    const cell = document.createElement('div');
    cell.style.cssText = 'position:relative;display:flex;align-items:center;justify-content:center;padding:10px 12px;background:#fff;';
    const c = el.cloneNode(true);
    c.removeAttribute('data-calib');
    const cs = getComputedStyle(el);
    if (cs.position === 'absolute' || cs.position === 'fixed') {
      c.style.position = 'static';
      c.style.left = 'auto'; c.style.top = 'auto'; c.style.right = 'auto'; c.style.bottom = 'auto';
    }
    c.style.margin = '0';
    // 位移施加在文字宿主上（模拟 pill-label）
    const host = c.querySelector('.pill-label') || c;
    host.style.transform = `translateY(${sh}px)`;
    cell.appendChild(c);
    // 红色中心线：画在胶囊自身的垂直中心
    const line = document.createElement('div');
    line.style.cssText = 'position:absolute;left:0;right:0;top:50%;height:1px;background:#ff0000;opacity:.85;';
    cell.appendChild(line);
    stage.appendChild(cell);
    made.push(c.getBoundingClientRect().height);
  }
  const r = stage.getBoundingClientRect();
  return { w: r.width, h: r.height };
};

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 4 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });

await page.evaluate(() => {
  const st = document.createElement('div');
  st.id = 'calib-stage';
  st.style.cssText =
    'position:fixed;left:0;top:0;z-index:999999;background:#fff;display:flex;align-items:center;gap:0;' +
    'padding:0;margin:0;pointer-events:none;font-size:0;';
  document.body.appendChild(st);
});

const results = [];
let n = 0;
for (const tab of ['home', 'menu', 'orders', 'me']) {
  await page.click(`#nav-tab-${tab}`);
  await page.waitForTimeout(800);
  for (const scroll of [0, 520, 1040, 1560]) {
    await page.evaluate((s) => {
      const sc = document.querySelector('.overflow-y-auto') || document.scrollingElement;
      sc.scrollTop = s;
    }, scroll);
    await page.waitForTimeout(340);
    await page.evaluate(() => document.querySelectorAll('[data-calib]').forEach((e) => e.removeAttribute('data-calib')));
    const found = await page.evaluate(FIND, TARGETS);
    for (let i = 0; i < found.length; i++) {
      const meta = found[i];
      if (results.some((r) => r.t === meta.t)) continue;
      const box = await page.evaluate(BUILD, { idx: i, shifts: SHIFTS });
      if (!box) continue;
      const file = `cal-${String(n).padStart(2, '0')}.png`;
      await page.locator('#calib-stage').screenshot({ path: `${OUT}/${file}` });
      n++;
      results.push({ ...meta, file, w: box.w, h: box.h, tab });
    }
  }
}

await page.evaluate(() => document.getElementById('calib-stage')?.remove());
fs.writeFileSync(`${OUT}/manifest.json`, JSON.stringify({ shifts: SHIFTS, items: results }, null, 1));
console.log(`标定 ${results.length} 颗：`);
for (const r of results) console.log(`  ${r.file}  «${r.t}»  h=${r.h} fs=${r.fs}`);
await browser.close();
