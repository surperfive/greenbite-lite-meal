/**
 * 用字体度量精确推导「文字墨迹中心相对行盒中心的偏移」。
 *
 * 原理：
 *   content area 顶 = baseline − A，底 = baseline + D   （A/D 来自字体度量）
 *   行盒（line-height 决定）把 content area 上下居中，所以
 *   baseline = 行盒中心 + (A − D)/2
 *   墨迹中心 = baseline + (inkDesc − inkAsc)/2
 *   ⇒ 墨迹中心 − 行盒中心 = (A−D)/2 + (inkDesc−inkAsc)/2     与 line-height 无关
 *
 * A / D 用 inline-block 探针（vertical-align: text-top / text-bottom / baseline）量，
 * 是精确浮点；canvas 的 actualBoundingBox* 也是浮点。
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';

const OUT = process.env.OUT_JSON || 'scripts/_shots/metric.json';

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
    el.setAttribute('data-m-pick', '1');
    rows.push({
      text: el.textContent.trim().replace(/\s+/g, ' ').slice(0, 22),
      h: +b.height.toFixed(2),
      fs: parseFloat(cs.fontSize),
      icon: !!el.querySelector('svg,img'),
      lh: cs.lineHeight,
      fw: cs.fontWeight,
      ff: cs.fontFamily,
    });
  }
  return rows;
};

const PROBE = (idx) => {
  const els = [...document.querySelectorAll('[data-m-pick]')];
  const el = els[idx];
  if (!el) return null;

  // 文字宿主：.pill-label，或把文本包进等价 inline-block
  let host = null;
  const labels = el.querySelectorAll('.pill-label');
  if (labels.length === 1) {
    host = labels[0];
  } else {
    const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let tn, first = null;
    while ((tn = walk.nextNode())) { if (tn.textContent.trim()) { first = tn; break; } }
    if (!first) return null;
    const wrap = document.createElement('span');
    wrap.style.cssText = 'display:inline-block;transform:none;line-height:inherit;font:inherit;letter-spacing:inherit';
    first.parentNode.insertBefore(wrap, first);
    wrap.appendChild(first);
    host = wrap;
  }

  const cs = getComputedStyle(host);
  const hr = host.getBoundingClientRect();
  const pr = el.getBoundingClientRect();
  const hc = hr.top + hr.height / 2;
  const pc = pr.top + pr.height / 2;

  // 文字的横向范围
  let tx0 = Infinity, tx1 = -Infinity;
  const walk = document.createTreeWalker(host, NodeFilter.SHOW_TEXT);
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

  return {
    text: host.textContent.trim().slice(0, 22),
    fs: +parseFloat(cs.fontSize).toFixed(2),
    lh: cs.lineHeight === 'normal' ? null : +parseFloat(cs.lineHeight).toFixed(2),
    hostH: +hr.height.toFixed(2),
    pillH: +pr.height.toFixed(2),
    dCenter: +(hc - pc).toFixed(2),          // >0 = 文字盒偏低
    pillAlign: getComputedStyle(el).alignItems,
    pillDisplay: getComputedStyle(el).display,
    padT: getComputedStyle(el).paddingTop,
    padB: getComputedStyle(el).paddingBottom,
    textW: +(tx1 - tx0).toFixed(1),
  };
};

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });

const EXTRA_CSS = process.env.EXTRA_CSS;
if (EXTRA_CSS) await page.addStyleTag({ content: EXTRA_CSS });

const seen = new Map();
const out = [];
for (const tab of ['home', 'menu', 'orders', 'me']) {
  await page.click(`#nav-tab-${tab}`);
  await page.waitForTimeout(800);
  for (const scroll of [0, 520, 1040, 1560]) {
    await page.evaluate((s) => {
      const sc = document.querySelector('.overflow-y-auto') || document.scrollingElement;
      sc.scrollTop = s;
    }, scroll);
    await page.waitForTimeout(340);
    await page.evaluate(() => document.querySelectorAll('[data-m-pick]').forEach((e) => e.removeAttribute('data-m-pick')));
    const found = await page.evaluate(SCAN);
    for (let i = 0; i < found.length; i++) {
      const meta = found[i];
      const key = `${meta.text}|${Math.round(meta.h)}|${meta.fs}`;
      if (seen.get(key) >= 2) continue;
      const r = await page.evaluate(PROBE, i);
      if (!r) continue;
      if (!seen.has(key)) seen.set(key, 0);
      seen.set(key, seen.get(key) + 1);
      out.push({ ...meta, ...r, tab });
    }
  }
}

fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
out.sort((a, b) => Math.abs(b.dCenter) - Math.abs(a.dCenter));
console.log(`${out.length} 条 → ${OUT}`);
console.log(`\n${'dCenter'.padStart(8)} {'pillH'.padStart(6)} {'hostH'.padStart(6)} {'fs'.padStart(5)} {'lh'.padStart(6)} align      text`);
console.log('-'.repeat(84));
for (const r of out) {
  if (Math.abs(r.dCenter) < 0.8) continue;
  console.log(`${String(r.dCenter).padStart(8)} ${String(r.pillH).padStart(6)} ${String(r.hostH).padStart(6)} ${String(r.fs).padStart(5)} ${String(r.lh).padStart(6)} ${r.pillAlign.padEnd(10)} ${r.text}`);
}
await browser.close();
