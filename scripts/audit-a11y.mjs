/**
 * 规范体检脚本：在真实渲染下量测 WCAG 对比度、触控尺寸、无障碍名称。
 *
 * 为什么不用静态扫描：Tailwind 的任意值、ring/border 叠加、渐变背景、
 * 半透明蒙层都会让「源码里写了什么颜色」和「屏幕上是什么颜色」不是一回事。
 * 所以这里跑真浏览器，逐元素取 computedStyle + getBoundingClientRect。
 *
 * 用法：node scripts/audit-a11y.mjs [outDir]
 */
import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';

const OUT = process.argv[2] ?? 'outputs/audit-a11y';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 1 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#app-loading-screen', { state: 'attached', timeout: 10000 }).catch(() => {});
await page.waitForSelector('#app-loading-screen', { state: 'detached', timeout: 25000 });
await page.waitForTimeout(500);

// 注入到页面里的审计函数。iOS/Android/pt 单位规则不适用这里，统一按 WCAG 2.2 的 CSS px 判。
await page.addScriptTag({
  content: `
window.__audit = function () {
  // ⚠️ Tailwind 4 的 computed color 是 oklch(0.208 0.042 265.755) 这种色彩空间写法，
  //    不是 rgb()。只认 rgb 会把 slate-900 / slate-100 / body 底色统统解析成 null，
  //    于是全部退化成「白底」—— 对比度结果会静默失真（本项目第一版审计就是这么错的）。
  //    这里借 canvas 让浏览器自己做色彩空间转换，rgb/oklch/oklab/hex/color() 全兼容。
  const _cv = document.createElement('canvas');
  _cv.width = _cv.height = 1;
  const _ctx = _cv.getContext('2d', { willReadFrequently: true });
  const parseColor = (s) => {
    if (!s || s === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
    _ctx.clearRect(0, 0, 1, 1);
    _ctx.fillStyle = '#FF00FE';        // 哨兵色：赋值失败时 fillStyle 会保持它，据此判定非法值
    _ctx.fillStyle = s;
    if (_ctx.fillStyle === '#FF00FE' && !/f+f0+0+f+e/i.test(String(s))) return null;
    _ctx.fillRect(0, 0, 1, 1);
    const d = _ctx.getImageData(0, 0, 1, 1).data;
    return { r: d[0], g: d[1], b: d[2], a: d[3] / 255 };
  };
  const over = (fg, bg) => ({
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
    a: 1,
  });
  const lum = (c) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  };
  const ratio = (a, b) => { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };

  const vis = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return false;
    const s = getComputedStyle(el);
    if (s.visibility === 'hidden' || s.display === 'none' || +s.opacity === 0) return false;
    return true;
  };

  // 有效背景：从根往下逐层 alpha 合成；任一祖先有 background-image 就判定为「不可算」。
  // ⚠️ 还要额外处理「绝对定位的滑块底色」：HeaderBar 的外卖/自取胶囊、各类 segmented
  //    control 都是把高亮底色画成一个 absolute 兄弟节点，文字自己不带背景。
  //    只沿祖先链找会误判成「白底 + 青柠字」= 1.25:1 的假阳性。
  const siblingPillBg = (el) => {
    const p = el.parentElement;
    if (!p) return null;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    let best = null;
    for (const sib of p.children) {
      if (sib === el) continue;
      const ss = getComputedStyle(sib);
      if (ss.position !== 'absolute') continue;
      const sr = sib.getBoundingClientRect();
      if (cx < sr.left || cx > sr.right || cy < sr.top || cy > sr.bottom) continue;
      const c = parseColor(ss.backgroundColor);
      if (!c || c.a === 0) continue;
      const area = sr.width * sr.height;
      if (!best || area < best.area) best = { c, area };
    }
    return best ? best.c : null;
  };

  const effectiveBg = (el) => {
    const chain = [];
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) chain.push(n);
    chain.reverse();
    let acc = { r: 255, g: 255, b: 255, a: 1 };  // 页面底色按白算
    for (const n of chain) {
      const s = getComputedStyle(n);
      if (s.backgroundImage && s.backgroundImage !== 'none') return null; // 渐变/图片，无法可靠计算
      const c = parseColor(s.backgroundColor);
      if (!c || c.a === 0) continue;
      acc = over(c, acc);
    }
    const pill = siblingPillBg(el);
    if (pill) acc = over(pill, acc);
    return acc;
  };

  const path = (el) => {
    const parts = [];
    for (let n = el; n && n.nodeType === 1 && parts.length < 4; n = n.parentElement) {
      let s = n.tagName.toLowerCase();
      if (n.id) { s += '#' + n.id; parts.unshift(s); break; }
      const cls = (n.getAttribute('class') || '').split(/\\s+/).filter(Boolean).slice(0, 2).join('.');
      if (cls) s += '.' + cls;
      parts.unshift(s);
    }
    return parts.join(' > ');
  };

  const contrast = [];
  const seen = new Set();
  for (const el of document.querySelectorAll('*')) {
    const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').trim();
    if (!own) continue;
    if (!vis(el)) continue;
    const s = getComputedStyle(el);
    const fg = parseColor(s.color);
    if (!fg) continue;
    const bg = effectiveBg(el);
    if (!bg) continue;
    const fgc = fg.a < 1 ? over(fg, bg) : fg;
    const cr = ratio(fgc, bg);
    const size = parseFloat(s.fontSize);
    const weight = +s.fontWeight || 400;
    const large = size >= 24 || (size >= 18.66 && weight >= 700);
    const need = large ? 3 : 4.5;
    if (cr < need) {
      const key = path(el) + '|' + own.slice(0, 24) + '|' + s.color;
      if (seen.has(key)) continue;
      seen.add(key);
      contrast.push({
        el: path(el),
        text: own.slice(0, 40),
        color: s.color,
        bg: 'rgb(' + [bg.r, bg.g, bg.b].map(Math.round).join(',') + ')',
        size: +size.toFixed(1),
        weight,
        ratio: +cr.toFixed(2),
        need,
        large,
        // WCAG 1.4.3 对「失效组件」豁免，但若禁用态本身承载了用户必须读懂的说明
        // （如「满 10 款起送」），仍应可读 —— 单独标出来由人判断。
        disabled: !!el.closest('button:disabled, [aria-disabled="true"]'),
      });
    }
  }
  contrast.sort((a, b) => a.ratio - b.ratio);

  // 触控目标
  const touch = [];
  const sel = 'button, a[href], [role="button"], input[type="checkbox"], input[type="radio"], [tabindex]:not([tabindex="-1"])';
  for (const el of document.querySelectorAll(sel)) {
    if (!vis(el)) continue;
    const r = el.getBoundingClientRect();
    const w = Math.round(r.width), h = Math.round(r.height);
    if (w >= 44 && h >= 44) continue;
    const name = (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 24);
    touch.push({
      el: path(el),
      name,
      size: w + 'x' + h,
      min: Math.min(w, h),
      wcag22: (w < 24 || h < 24) ? 'FAIL_24' : 'ok',
    });
  }
  touch.sort((a, b) => a.min - b.min);

  // 无名称的可交互元素
  const unnamed = [];
  for (const el of document.querySelectorAll('button, a[href], [role="button"]')) {
    if (!vis(el)) continue;
    const label = (el.getAttribute('aria-label') || '').trim();
    const txt = (el.textContent || '').trim();
    const imgAlt = [...el.querySelectorAll('img')].map((i) => (i.getAttribute('alt') || '').trim()).join('');
    const title = (el.getAttribute('title') || '').trim();
    if (!label && !txt && !imgAlt && !title) unnamed.push({ el: path(el), html: el.outerHTML.slice(0, 90) });
  }

  // 图片 alt
  const noAlt = [...document.querySelectorAll('img')]
    .filter((i) => i.getAttribute('alt') === null)
    .map((i) => ({ src: (i.getAttribute('src') || '').slice(0, 80), cls: (i.getAttribute('class') || '').slice(0, 60) }));

  // 焦点可见性：是否存在全局移除 outline 且没有替代
  const focusRules = [];
  for (const sheet of document.styleSheets) {
    let rules; try { rules = sheet.cssRules; } catch { continue; }
    for (const r of rules || []) {
      if (r.selectorText && /:focus/.test(r.selectorText)) {
        const t = r.cssText.slice(0, 160);
        if (/outline:\\s*none|outline:\\s*0/.test(t)) focusRules.push(t);
      }
    }
  }

  // 减少动效
  let reducedMotionRules = 0;
  for (const sheet of document.styleSheets) {
    let rules; try { rules = sheet.cssRules; } catch { continue; }
    for (const r of rules || []) {
      if (r.conditionText && /prefers-reduced-motion/.test(r.conditionText)) reducedMotionRules++;
    }
  }

  return {
    url: location.href,
    contrast: contrast.slice(0, 60),
    contrastCount: contrast.length,
    touch: touch.slice(0, 80),
    touchCount: touch.length,
    touchFail24: touch.filter((t) => t.wcag22 === 'FAIL_24').length,
    unnamed,
    noAlt,
    focusRules,
    reducedMotionRules,
    docTitle: document.title,
    lang: document.documentElement.lang || '(empty)',
    h1Count: document.querySelectorAll('h1').length,
    landmarks: {
      main: document.querySelectorAll('main').length,
      nav: document.querySelectorAll('nav').length,
      ariaLabelNav: document.querySelectorAll('nav[aria-label]').length,
    },
  };
};
`,
});

const tabs = ['home', 'menu', 'gacha', 'orders', 'me'];
const results = {};
for (const t of tabs) {
  const btn = await page.$(`#nav-tab-${t}`);
  if (!btn) { results[t] = { error: 'tab not found' }; continue; }
  await btn.click();
  await page.waitForTimeout(1400);
  await page.mouse.move(2, 2);
  await page.waitForTimeout(200);
  results[t] = await page.evaluate(() => window.__audit());
  await page.screenshot({ path: `${OUT}/tab-${t}.png` });
}

writeFileSync(`${OUT}/audit.json`, JSON.stringify(results, null, 1), 'utf8');

const summary = Object.entries(results).map(([k, v]) => ({
  tab: k,
  contrastFail: v.contrastCount,
  touchFail44: v.touchCount,
  touchFail24: v.touchFail24,
  unnamed: v.unnamed?.length,
  noAlt: v.noAlt?.length,
  reducedMotionRules: v.reducedMotionRules,
  h1Count: v.h1Count,
  lang: v.lang,
}));
console.log(JSON.stringify(summary, null, 1));
await browser.close();
