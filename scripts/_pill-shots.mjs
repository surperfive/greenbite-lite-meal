/**
 * 采集所有「胶囊」的位置 + 3× 截图，供 `_pill-ink.py` 用像素量真实墨迹中心。
 *
 * 为什么不用 canvas 字体度量：Chrome 的 fontBoundingBox* 只有整数精度，
 * 8.5px 字号上 1px 误差就是 0.12em，判断不了「居中」。
 * 为什么不用 Range 的 rect：那是行盒/内容盒，不是字形墨迹。
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';

// SIM_NUDGE=0.075 时先把所有胶囊文字包一层并施加 translateY(-em)，用来验证修法
const NUDGE = process.env.SIM_NUDGE;
const SIM_CSS = process.env.SIM_CSS;
const OUT = process.env.OUT_DIR || 'scripts/_shots/pills';
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const DPR = 3;

const SCAN = () => {
  const rows = [];
  const els = [...document.querySelectorAll('div,span,button,a,li,label,strong,em,p')];
  for (const el of els) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    if (parseFloat(cs.opacity) === 0) continue;
    const b = el.getBoundingClientRect();
    if (b.width < 18 || b.height < 12 || b.height > 60) continue;
    if (b.top < 0 || b.bottom > innerHeight || b.left < 0 || b.right > innerWidth) continue;
    const radii = [
      cs.borderTopLeftRadius, cs.borderTopRightRadius,
      cs.borderBottomLeftRadius, cs.borderBottomRightRadius,
    ].map(parseFloat);
    if (Math.min(...radii) < Math.max(6, b.height * 0.4)) continue;

    // 叶子文本节点
    const texts = [];
    const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walk.nextNode())) if (n.textContent.trim()) texts.push(n);
    if (!texts.length) continue;

    // 文本的横向范围（用来排除图标对墨迹包围盒的干扰）
    let tx0 = Infinity, tx1 = -Infinity, ty0 = Infinity, ty1 = -Infinity;
    for (const tn of texts) {
      const r = document.createRange();
      r.selectNodeContents(tn);
      const rr = r.getBoundingClientRect();
      if (rr.width === 0) continue;
      tx0 = Math.min(tx0, rr.left);
      tx1 = Math.max(tx1, rr.right);
      ty0 = Math.min(ty0, rr.top);
      ty1 = Math.max(ty1, rr.bottom);
    }
    if (!isFinite(tx0)) continue;

    rows.push({
      text: el.textContent.trim().replace(/\s+/g, ' ').slice(0, 16),
      cls: (el.className || '').toString().slice(0, 110),
      x: +b.left.toFixed(2), y: +b.top.toFixed(2),
      w: +b.width.toFixed(2), h: +b.height.toFixed(2),
      tx0: +tx0.toFixed(2), tx1: +tx1.toFixed(2),
      ty0: +ty0.toFixed(2), ty1: +ty1.toFixed(2),
      hasIcon: !!el.querySelector('svg,img'),
      fs: parseFloat(cs.fontSize),
      lh: cs.lineHeight,
      ai: cs.alignItems,
    });
  }
  // 去掉完全重复的（嵌套容器重复命中）
  const seen = new Set();
  return rows.filter((r) => {
    const k = `${r.text}|${r.x}|${r.y}|${r.w}|${r.h}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
};

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: DPR });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });

const EXTRA_CSS = process.env.EXTRA_CSS;
if (EXTRA_CSS) await page.addStyleTag({ content: EXTRA_CSS });

const manifest = [];
let idx = 0;
for (const tab of ['home', 'menu', 'orders', 'me']) {
  await page.click(`#nav-tab-${tab}`);
  await page.waitForTimeout(900);
  if (NUDGE || SIM_CSS) {
    // 模拟修法：把每颗胶囊里的文本包进 <span> 并上移 NUDGE em
    await page.evaluate(({ em, css }) => {
      const st = document.createElement('style');
      st.id = 'sim-nudge';
      st.textContent = css || `.sim-nudge{display:inline-block;transform:translateY(-${em}em)}`;
      document.head.appendChild(st);
      const els = [...document.querySelectorAll('div,span,button,a,li,label,strong,em,p')];
      for (const el of els) {
        const cs = getComputedStyle(el);
        const b = el.getBoundingClientRect();
        if (b.width < 18 || b.height < 12 || b.height > 60) continue;
        const radii = [cs.borderTopLeftRadius, cs.borderTopRightRadius, cs.borderBottomLeftRadius, cs.borderBottomRightRadius].map(parseFloat);
        if (Math.min(...radii) < Math.max(6, b.height * 0.4)) continue;
        const texts = [];
        const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        let n;
        while ((n = walk.nextNode())) if (n.textContent.trim()) texts.push(n);
        for (const tn of texts) {
          if (tn.parentElement.closest('.sim-nudge')) continue;
          const sp = document.createElement('span');
          sp.className = 'sim-nudge';
          tn.parentNode.insertBefore(sp, tn);
          sp.appendChild(tn);
        }
      }
    }, { em: NUDGE, css: SIM_CSS });
    await page.waitForTimeout(200);
  }
  for (const scroll of [0, 520, 1040, 1560]) {
    await page.evaluate((s) => {
      const sc = document.querySelector('.overflow-y-auto') || document.scrollingElement;
      sc.scrollTop = s;
    }, scroll);
    await page.waitForTimeout(420);
    const rows = await page.evaluate(SCAN);
    if (!rows.length) continue;
    const shot = `p-${String(idx).padStart(3, '0')}.png`;
    await page.screenshot({ path: `${OUT}/${shot}` });
    for (const r of rows) manifest.push({ ...r, tab, scroll, shot });
    idx++;
  }
}

fs.writeFileSync(`${OUT}/manifest.json`, JSON.stringify({ dpr: DPR, items: manifest }, null, 1));
console.log(`采集 ${manifest.length} 颗胶囊，${idx} 张截图 → ${OUT}`);
const byTab = manifest.reduce((a, r) => ((a[r.tab] = (a[r.tab] || 0) + 1), a), {});
console.log(byTab);
await browser.close();
