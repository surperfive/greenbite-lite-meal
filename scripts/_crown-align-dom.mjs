import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 4 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 30000 }).catch(() => {});
await page.waitForFunction(() => {
  const s = document.getElementById('app-page-stage');
  return s && getComputedStyle(s).opacity === '1';
}, { timeout: 30000 });
await page.click('#nav-tab-gacha');
await page.waitForFunction(() => {
  const s = document.getElementById('app-page-stage');
  return s && getComputedStyle(s).opacity === '1';
}, { timeout: 30000 });
await page.waitForTimeout(1200);

const out = await page.evaluate(() => {
  // 把 user space 的 bbox 四角经 CTM 变换到屏幕，取外接矩形
  const toScreen = (el, bbox) => {
    const m = el.getScreenCTM();
    const pts = [
      [bbox.x, bbox.y], [bbox.x + bbox.width, bbox.y],
      [bbox.x, bbox.y + bbox.height], [bbox.x + bbox.width, bbox.y + bbox.height],
    ].map(([x, y]) => ({ x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f }));
    const ys = pts.map(p => p.y), xs = pts.map(p => p.x);
    return { top: Math.min(...ys), bottom: Math.max(...ys), left: Math.min(...xs), right: Math.max(...xs) };
  };

  // 1) 皇冠：path 几何 bbox + strokeWidth/2（stroke 是居中描边，向外各扩 1 单位）
  const crownPath = document.querySelector('#badge-crown path');
  const cb = crownPath.getBBox();
  const sw = parseFloat(crownPath.getAttribute('strokeWidth') || '0');
  const crownInk = toScreen(crownPath, { x: cb.x - sw / 2, y: cb.y - sw / 2, width: cb.width + sw, height: cb.height + sw });

  // 2) 文字：逐字 getExtentOfChar（Chrome 给的是字形墨迹框，不含行高留白）
  const t = document.getElementById('txt-discount');
  let tTop = Infinity, tBot = -Infinity, tLeft = Infinity, tRight = -Infinity;
  const chars = [];
  for (let i = 0; i < t.getNumberOfChars(); i++) {
    const e = t.getExtentOfChar(i);
    const s = toScreen(t, e);
    chars.push({ ch: t.textContent[i], top: +s.top.toFixed(2), bottom: +s.bottom.toFixed(2) });
    tTop = Math.min(tTop, s.top); tBot = Math.max(tBot, s.bottom);
    tLeft = Math.min(tLeft, s.left); tRight = Math.max(tRight, s.right);
  }

  const crownCy = (crownInk.top + crownInk.bottom) / 2;
  const textCy = (tTop + tBot) / 2;
  return {
    crownLocalBBox: { x: cb.x, y: cb.y, w: cb.width, h: cb.height },
    crownInk, textInk: { top: tTop, bottom: tBot, left: tLeft, right: tRight },
    crownCy, textCy, delta: crownCy - textCy,
    chars,
    gap: tLeft - crownInk.right,
    textW: tRight - tLeft,
  };
});

console.log('皇冠局部 bbox   ', JSON.stringify(out.crownLocalBBox));
console.log('皇冠墨迹(屏幕)  top=%s bottom=%s  h=%s', out.crownInk.top.toFixed(2), out.crownInk.bottom.toFixed(2), (out.crownInk.bottom - out.crownInk.top).toFixed(2));
console.log('文字墨迹(屏幕)  top=%s bottom=%s  h=%s', out.textInk.top.toFixed(2), out.textInk.bottom.toFixed(2), (out.textInk.bottom - out.textInk.top).toFixed(2));
console.log('逐字 top/bottom ', out.chars.map(c => `${c.ch}:${c.top}~${c.bottom}`).join('  '));
console.log('');
console.log('皇冠中心 = %s   文字中心 = %s   Δ = %s css', out.crownCy.toFixed(3), out.textCy.toFixed(3), out.delta.toFixed(3));
console.log('皇冠→文字水平间距 = %s css   文字墨迹宽 = %s css', out.gap.toFixed(2), out.textW.toFixed(2));
console.log(out.delta > 0 ? '⚠️ 皇冠偏低' : '⚠️ 皇冠偏高');
console.log(Math.abs(out.delta) <= 0.3 ? '✅ 水平对齐达标 (|Δ| <= 0.3css)' : '❌ 需修正，Δ = ' + out.delta.toFixed(3) + 'css');
await browser.close();
