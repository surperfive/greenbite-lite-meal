/**
 * 扫描所有「胶囊」里文字的垂直居中情况。
 *
 * 关键：不能只用 Range 的 rect —— 那是行盒（含行高），不是字形墨迹。
 * 做法：
 *   ① 在文本节点后面插一个 width/height 0 的 inline-block，它的 bottom 就是该行基线；
 *   ② canvas measureText 拿 actualBoundingBoxAscent/Descent = 真实墨迹上下缘（相对基线）；
 *   ③ 墨迹中心 = baseline − (inkAsc − inkDesc) / 2；
 *   ④ 偏移 = 墨迹中心 − 胶囊几何中心（正 = 偏下）。
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';

const OUT = 'scripts/_shots';
fs.mkdirSync(OUT, { recursive: true });

const SCAN = () => {
  const cvs = document.createElement('canvas').getContext('2d');
  const rows = [];
  const seen = new Set();

  const isPill = (el, b, cs) => {
    const radii = [
      cs.borderTopLeftRadius, cs.borderTopRightRadius,
      cs.borderBottomLeftRadius, cs.borderBottomRightRadius,
    ].map(parseFloat);
    const minR = Math.min(...radii);
    return minR >= Math.max(6, b.height * 0.4);
  };

  const els = [...document.querySelectorAll('div,span,button,a,li,p,label,strong,em')];
  for (const el of els) {
    if (seen.has(el)) continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    if (parseFloat(cs.opacity) === 0) continue;
    const b = el.getBoundingClientRect();
    if (b.width < 18 || b.height < 12 || b.height > 60) continue;
    if (b.bottom < 0 || b.top > innerHeight) continue; // 视口内
    if (!isPill(el, b, cs)) continue;

    // 收集叶子文本节点
    const texts = [];
    const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walk.nextNode())) {
      const t = n.textContent.trim();
      if (!t) continue;
      texts.push(n);
    }
    if (!texts.length) continue;

    // 逐文本节点量墨迹
    let inkTop = Infinity, inkBottom = -Infinity, baseSample = null;
    for (const tn of texts) {
      const pe = tn.parentElement;
      if (!pe) continue;
      const pcs = getComputedStyle(pe);
      const marker = document.createElement('span');
      marker.style.cssText = 'display:inline-block;width:0;height:0;overflow:hidden;';
      tn.parentNode.insertBefore(marker, tn.nextSibling);
      const baseline = marker.getBoundingClientRect().bottom;
      marker.remove();

      cvs.font = `${pcs.fontStyle} ${pcs.fontWeight} ${pcs.fontSize} ${pcs.fontFamily}`;
      const m = cvs.measureText(tn.textContent);
      const a = m.actualBoundingBoxAscent ?? 0;
      const d = m.actualBoundingBoxDescent ?? 0;
      const top = baseline - a;
      const bot = baseline + d;
      if (top < inkTop) inkTop = top;
      if (bot > inkBottom) inkBottom = bot;
      if (!baseSample) {
        baseSample = {
          fs: parseFloat(pcs.fontSize),
          lh: pcs.lineHeight,
          baseline: +baseline.toFixed(2),
          inkA: +a.toFixed(2),
          inkD: +d.toFixed(2),
        };
      }
    }
    if (!isFinite(inkTop)) continue;

    const inkCenter = (inkTop + inkBottom) / 2;
    const pillCenter = b.top + b.height / 2;
    const offset = inkCenter - pillCenter;
    const fs = baseSample.fs;
    seen.add(el);

    rows.push({
      text: el.textContent.trim().slice(0, 14),
      cls: (el.className || '').toString().slice(0, 90),
      h: +b.height.toFixed(1),
      w: +b.width.toFixed(1),
      fs,
      lh: baseSample.lh,
      padT: cs.paddingTop,
      padB: cs.paddingBottom,
      disp: cs.display,
      ai: cs.alignItems,
      inkH: +(inkBottom - inkTop).toFixed(2),
      offset: +offset.toFixed(2),
      offsetEm: +(offset / fs).toFixed(3),
      tag: el.tagName.toLowerCase(),
    });
  }
  return rows;
};

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });

const all = {};
for (const tab of ['home', 'menu', 'orders', 'me']) {
  await page.click(`#nav-tab-${tab}`);
  await page.waitForTimeout(900);
  // 滚一遍把懒加载内容带出来，再回顶
  await page.evaluate(async () => {
    const sc = document.querySelector('.overflow-y-auto') || document.scrollingElement;
    for (let i = 0; i < 6; i++) {
      sc.scrollTop += 500;
      await new Promise((r) => setTimeout(r, 120));
    }
    sc.scrollTop = 0;
  });
  await page.waitForTimeout(500);
  all[tab] = await page.evaluate(SCAN);
}

fs.writeFileSync('scripts/_shots/pill-scan.json', JSON.stringify(all, null, 1));

for (const [tab, rows] of Object.entries(all)) {
  const bad = rows.filter((r) => Math.abs(r.offset) >= 0.8).sort((a, b) => Math.abs(b.offset) - Math.abs(a.offset));
  console.log(`\n=== ${tab}  共 ${rows.length} 颗胶囊，偏移 ≥0.8px 的 ${bad.length} 颗 ===`);
  for (const r of bad.slice(0, 14)) {
    console.log(
      `${String(r.offset).padStart(6)}px (${String(r.offsetEm).padStart(6)}em) h=${String(r.h).padStart(5)} fs=${String(r.fs).padStart(4)} lh=${String(r.lh).padStart(7)} pt/pb=${r.padT}/${r.padB} ai=${r.ai} «${r.text}»  ${r.cls}`
    );
  }
}

await browser.close();
