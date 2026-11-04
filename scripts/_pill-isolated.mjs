/**
 * 隔离测量 v2：把每颗胶囊 clone 到白底舞台，然后**直接对克隆节点截图**。
 * 元素截图的坐标严格等于胶囊 border box，不存在 clip 偏移问题。
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';

const OUT = process.env.OUT_DIR || 'scripts/_shots/iso';
const DPR = Number(process.env.DPR || 4);
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const SCAN = () => {
  const rows = [];
  for (const el of document.querySelectorAll('div,span,button,a,li,label,strong,em,p')) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) continue;
    const b = el.getBoundingClientRect();
    if (b.width < 18 || b.height < 12 || b.height > 60) continue;
    if (b.top < 0 || b.bottom > innerHeight) continue;
    const radii = [cs.borderTopLeftRadius, cs.borderTopRightRadius, cs.borderBottomLeftRadius, cs.borderBottomRightRadius].map(parseFloat);
    if (Math.min(...radii) < Math.max(6, b.height * 0.4)) continue;
    let hasText = false;
    const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walk.nextNode())) if (n.textContent.trim()) hasText = true;
    if (!hasText) continue;
    el.setAttribute('data-iso-pick', '1');
    rows.push({
      text: el.textContent.trim().replace(/\s+/g, ' ').slice(0, 20),
      h: +b.height.toFixed(1),
      fs: parseFloat(cs.fontSize),
      icon: !!el.querySelector('svg,img'),
      bg: cs.backgroundColor,
      color: cs.color,
      lh: cs.lineHeight,
    });
  }
  return rows;
};

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: DPR });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });

// 白底舞台放在安全位置，避免和 app 内容重叠
await page.evaluate(() => {
  const st = document.createElement('div');
  st.id = 'iso-stage';
  st.style.cssText =
    'position:fixed;left:8px;top:8px;z-index:999999;background:#fff;padding:0;margin:0;' +
    'pointer-events:none;display:flex;align-items:flex-start;gap:0;';
  document.body.appendChild(st);
});

const EXTRA_CSS = process.env.EXTRA_CSS;
if (EXTRA_CSS) await page.addStyleTag({ content: EXTRA_CSS });

const seen = new Map();
let shotIdx = 0;
const items = [];

for (const tab of ['home', 'menu', 'orders', 'me']) {
  await page.click(`#nav-tab-${tab}`);
  await page.waitForTimeout(900);
  for (const scroll of [0, 520, 1040, 1560]) {
    await page.evaluate((s) => {
      const sc = document.querySelector('.overflow-y-auto') || document.scrollingElement;
      sc.scrollTop = s;
    }, scroll);
    await page.waitForTimeout(380);
    await page.evaluate(() => document.querySelectorAll('[data-iso-pick]').forEach((e) => e.removeAttribute('data-iso-pick')));
    const found = await page.evaluate(SCAN);
    if (!found.length) continue;

    for (let i = 0; i < found.length; i++) {
      const meta = found[i];
      const key = `${meta.text}|${Math.round(meta.h)}|${meta.fs}`;
      if (seen.get(key) >= 2) continue;

      const info = await page.evaluate((idx) => {
        const els = [...document.querySelectorAll('[data-iso-pick]')];
        const el = els[idx];
        if (!el) return null;
        const stage = document.getElementById('iso-stage');
        stage.innerHTML = '';
        const c = el.cloneNode(true);
        c.removeAttribute('data-iso-pick');
        c.id = 'iso-clone';
        c.style.margin = '0';
        c.style.transform = 'none';
        const cs = getComputedStyle(el);
        if (cs.position === 'absolute' || cs.position === 'fixed') {
          c.style.position = 'static';
          c.style.left = 'auto'; c.style.top = 'auto';
          c.style.right = 'auto'; c.style.bottom = 'auto';
        }
        stage.appendChild(c);
        const r = c.getBoundingClientRect();
        let tx0 = Infinity, tx1 = -Infinity;
        const walk = document.createTreeWalker(c, NodeFilter.SHOW_TEXT);
        let tn;
        while ((tn = walk.nextNode())) {
          if (!tn.textContent.trim()) continue;
          const rg = document.createRange();
          rg.selectNodeContents(tn);
          const rr = rg.getBoundingClientRect();
          if (rr.width === 0) continue;
          tx0 = Math.min(tx0, rr.left);
          tx1 = Math.max(tx1, rr.right);
        }
        if (!isFinite(tx0)) return null;
        return {
          w: r.width, h: r.height,
          tx0: tx0 - r.left, tx1: tx1 - r.left,
        };
      }, i);
      if (!info || info.w < 6 || info.h < 6) continue;

      const file = `iso-${String(shotIdx).padStart(3, '0')}.png`;
      await page.locator('#iso-clone').screenshot({ path: `${OUT}/${file}`, omitBackground: false });
      shotIdx++;
      if (!seen.has(key)) seen.set(key, 0);
      seen.set(key, seen.get(key) + 1);
      items.push({
        ...meta, tab, file,
        w: +info.w.toFixed(2), hh: +info.h.toFixed(2),
        tx0: +info.tx0.toFixed(2), tx1: +info.tx1.toFixed(2),
      });
    }
  }
}

await page.evaluate(() => document.getElementById('iso-stage')?.remove());
fs.writeFileSync(`${OUT}/manifest.json`, JSON.stringify({ dpr: DPR, items }, null, 1));
console.log(`隔离截图 ${items.length} 颗 / ${new Set(items.map((i) => i.text)).size} 种 → ${OUT}`);
await browser.close();
