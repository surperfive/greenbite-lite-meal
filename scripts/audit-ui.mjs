/**
 * 全站 UI 规范审计（ui-ux-pro-max 的 Pre-Delivery Checklist 落地版）。
 *
 * 逐页扫一遍，量化四类硬指标，输出可排序的问题清单：
 *   ① 触摸目标 < 44×44（WCAG 2.5.5 / iOS HIG）
 *   ② 正文/次要文字对比度 < 4.5:1（大字号 < 3:1）
 *   ③ 图标按钮无无障碍名、img 缺 alt
 *   ④ 横向溢出、字号 < 12px 的正文
 *
 * 用法：node scripts/audit-ui.mjs [输出目录]
 * 产物：outputs/audit/audit.json + console 摘要
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = process.env.BASE || 'http://127.0.0.1:5173/';
const OUT = process.argv[2] || 'outputs/audit';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

mkdirSync(OUT, { recursive: true });

/* ── 注入页面的审计函数 ─────────────────────────────────────────── */
const AUDIT_FN = () => {
  const parseColor = (s) => {
    const m = s.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(',').map((v) => parseFloat(v));
    return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1];
  };
  const over = (fg, bg) => {
    const a = fg[3];
    return [
      fg[0] * a + bg[0] * (1 - a),
      fg[1] * a + bg[1] * (1 - a),
      fg[2] * a + bg[2] * (1 - a),
      1,
    ];
  };
  // 沿祖先链合成实际底色；遇到背景图/渐变返回 null（无法可靠计算）
  const bgOf = (el) => {
    let node = el;
    let acc = null;
    while (node && node !== document.documentElement) {
      const cs = getComputedStyle(node);
      if (cs.backgroundImage !== 'none') return null;
      const c = parseColor(cs.backgroundColor);
      if (c && c[3] > 0) acc = acc ? over(acc, c) : c;
      if (acc && acc[3] >= 0.999) return acc;
      node = node.parentElement;
    }
    const body = parseColor(getComputedStyle(document.body).backgroundColor);
    return acc ? over(acc, body || [255, 255, 255, 1]) : body || [255, 255, 255, 1];
  };
  const lum = (c) => {
    const f = (v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
  };
  const ratio = (a, b) => {
    const l1 = lum(a);
    const l2 = lum(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  };
  const visible = (el) => {
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity < 0.05) return false;
    const r = el.getBoundingClientRect();
    return r.width > 1 && r.height > 1 && r.bottom > -80 && r.top < innerHeight + 400;
  };
  const label = (el) => {
    const t = (el.innerText || el.getAttribute('aria-label') || el.title || '').trim();
    return t.slice(0, 28).replace(/\s+/g, ' ');
  };
  const path = (el) => {
    const parts = [];
    let n = el;
    for (let i = 0; i < 3 && n && n !== document.body; i++, n = n.parentElement) {
      let s = n.tagName.toLowerCase();
      if (n.id) s += '#' + n.id;
      else if (n.className && typeof n.className === 'string') {
        const c = n.className.split(/\s+/).filter(Boolean).slice(0, 2).join('.');
        if (c) s += '.' + c;
      }
      parts.unshift(s);
    }
    return parts.join('>');
  };

  /* ① 触摸目标
     ⚠️ 不能只看 border-box：项目用 `.gb-hit` / `.gb-hit-y` 把命中区用 ::after 撑到 44，
        视觉尺寸不变、布局不动的做法是合规的（WCAG 2.5.5 算的是命中区）。
        所以这里量的是「实际可点区域 = max(自身, ::after)」。 */
  const hitSize = (el, r) => {
    const a = getComputedStyle(el, '::after');
    if (a && a.content && a.content !== 'none' && a.position === 'absolute') {
      const w = parseFloat(a.width);
      const h = parseFloat(a.height);
      return [Math.max(r.width, isFinite(w) ? w : 0), Math.max(r.height, isFinite(h) ? h : 0)];
    }
    return [r.width, r.height];
  };
  const clickable = [...document.querySelectorAll('button, a[href], [role="button"], [role="tab"], input[type="checkbox"], label[for]')];
  const smallTargets = [];
  for (const el of clickable) {
    if (!visible(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.width >= 44 && r.height >= 44) continue;
    const [hw, hh] = hitSize(el, r);
    smallTargets.push({
      el: path(el),
      text: label(el),
      w: +r.width.toFixed(1),
      h: +r.height.toFixed(1),
      hitW: +hw.toFixed(1),
      hitH: +hh.toFixed(1),
      // pass = 命中区已达标（视觉小、但可点区域够大，属于合规写法）
      pass: hw >= 44 && hh >= 44,
    });
  }

  /* ② 对比度 + ④ 小字号：只看直接含文本的叶子元素 */
  const textEls = [...document.querySelectorAll('body *')].filter((el) => {
    if (!visible(el)) return false;
    if (['SCRIPT', 'STYLE', 'SVG', 'PATH'].includes(el.tagName)) return false;
    const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 0);
    if (!own) return false;
    return true;
  });
  const contrast = [];
  const tinyText = [];
  for (const el of textEls) {
    const cs = getComputedStyle(el);
    const fs = parseFloat(cs.fontSize);
    const text = label(el);
    if (!text) continue;
    if (fs < 12) {
      tinyText.push({ el: path(el), text, fs: +fs.toFixed(1), color: cs.color });
    }
    const fg = parseColor(cs.color);
    const bg = bgOf(el);
    if (!fg || !bg) continue;
    const fgc = over(fg, bg);
    const cr = ratio(fgc, bg);
    const bold = +cs.fontWeight >= 700;
    const large = fs >= 24 || (fs >= 18.66 && bold);
    const need = large ? 3 : 4.5;
    if (cr < need) {
      contrast.push({
        el: path(el),
        text,
        fs: +fs.toFixed(1),
        color: cs.color,
        bg: `rgb(${bg.slice(0, 3).map(Math.round).join(',')})`,
        ratio: +cr.toFixed(2),
        need,
      });
    }
  }

  /* ③ 语义 */
  const unnamed = clickable
    .filter((el) => visible(el))
    .filter((el) => {
      const name =
        (el.getAttribute('aria-label') || el.title || el.innerText || '').trim() ||
        el.querySelector('img[alt]:not([alt=""])');
      return !name;
    })
    .map((el) => ({ el: path(el), w: +el.getBoundingClientRect().width.toFixed(1), h: +el.getBoundingClientRect().height.toFixed(1) }));

  const noAlt = [...document.querySelectorAll('img:not([alt])')]
    .filter(visible)
    .map((el) => ({ el: path(el), src: (el.currentSrc || el.src || '').split('/').pop() }));

  /* ④ 横向溢出 */
  const de = document.documentElement;
  const overflowX = de.scrollWidth - de.clientWidth;

  return {
    smallTargets,
    contrast,
    tinyText,
    unnamed,
    noAlt,
    overflowX,
    counts: {
      clickable: clickable.filter(visible).length,
      text: textEls.length,
    },
  };
};

/* ── 跑一遍 ─────────────────────────────────────────────────────── */
const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2, locale: 'zh-CN' });

await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#app-loading-screen', { state: 'detached', timeout: 25000 }).catch(() => {});
await page.waitForTimeout(600);

const settle = async () => {
  // 每次切页都会重放品牌过场，等它自己退场
  await page.waitForSelector('#app-loading-screen', { state: 'detached', timeout: 15000 }).catch(() => {});
  await page.getByText('跳过', { exact: true }).first().click({ timeout: 500 }).catch(() => {});
  await page.waitForTimeout(900);
  await page.evaluate(() => document.fonts.ready);
};

const PAGES = [
  ['home', 'home'],
  ['menu', 'menu'],
  ['gacha', 'gacha'],
  ['orders', 'orders'],
  ['me', 'me'],
];

const report = { viewport: '375x812', generatedAt: new Date().toISOString(), pages: {} };

for (const [key, tab] of PAGES) {
  /* ⚠️ 切 Tab 会被加载过场打断（下层是 `inert`，点击直接丢掉）。
     所以点一次、等过场、核对 `aria-current="page"`，没切过去就再点，最多 3 次。 */
  for (let attempt = 0; attempt < 3; attempt++) {
    await page.click(`#nav-tab-${tab}`).catch(() => {});
    await settle();
    const active = await page.evaluate(
      (t) => document.querySelector(`#nav-tab-${t}`)?.getAttribute('aria-current') === 'page',
      tab
    );
    if (active) break;
  }
  // 每页都从顶部开始量，避免视口外的元素被判为不可见
  await page.evaluate(() => {
    document.querySelectorAll('div').forEach((d) => {
      if (d.scrollTop > 0) d.scrollTop = 0;
    });
  });
  report.pages[key] = await page.evaluate(AUDIT_FN);
  const p = report.pages[key];
  const visualSmall = p.smallTargets.length;
  const hitSmall = p.smallTargets.filter((t) => !t.pass).length;
  console.log(
    `${key.padEnd(7)} 视觉<44: ${String(visualSmall).padStart(3)}（扩命中区后 ${String(hitSmall).padStart(3)}）  ` +
      `contrast: ${String(p.contrast.length).padStart(3)}  ` +
      `tiny: ${String(p.tinyText.length).padStart(3)}  ` +
      `unnamed: ${String(p.unnamed.length).padStart(2)}  ` +
      `noAlt: ${String(p.noAlt.length).padStart(2)}  ` +
      `overflowX: ${p.overflowX}`
  );
}

writeFileSync(`${OUT}/audit.json`, JSON.stringify(report, null, 2), 'utf8');
await browser.close();
console.log(`\n→ ${OUT}/audit.json`);
