/**
 * 生成作品集用的「规范证据图」：每张只截有问题的那个控件，并叠加标注。
 *
 * 为什么现做：项目里现成的 before/after 大多是像素微调（缩略图系数、指示点位置），
 * 属于审美迭代；作品集要的是「规范驱动」的证据，所以按规范条目重新取证：
 *   · 触摸目标：视觉 24px 的按钮，命中区实际 44px（用两个虚线框量出来）
 *   · 焦点可见：同一控件「无焦点环 / 2px 深墨环」两种状态
 *   · 对比度：禁用态 #94A3B8(2.56:1) vs #475569(7.58:1)
 *   · 品牌取舍：#FC5294 价格 3.10:1 的显式决策
 *
 * 输出：outputs/cases/*.png（2x 清晰度）
 * 用法：node scripts/make-case-shots.mjs
 */
import { chromium } from 'playwright';
import fs from 'node:fs';

const BASE = 'http://127.0.0.1:5173/';
const OUT = 'outputs/cases';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });

const ANNO_CSS = `
.gb-anno{position:fixed;pointer-events:none;z-index:99999;box-sizing:border-box}
.gb-box{position:fixed;box-sizing:border-box;pointer-events:none;z-index:99999}
.gb-lbl{position:fixed;pointer-events:none;z-index:99999;font:700 10.5px/1.35 'Plus Jakarta Sans','Noto Sans SC',sans-serif;
  background:#070906;color:#fff;padding:2.5px 6px;border-radius:5px;white-space:nowrap;letter-spacing:.01em;
  box-shadow:0 2px 8px rgba(7,9,6,.25)}
.gb-lbl.lime{background:#C7F665;color:#070906}
.gb-lbl.pink{background:#FC5294;color:#fff}
`;

const inject = async () => {
  await page.addStyleTag({ content: ANNO_CSS });
};

const clear = async () => {
  await page.evaluate(() => document.querySelectorAll('.gb-anno,.gb-box,.gb-lbl').forEach((n) => n.remove()));
};

/** 画一个框 + 标签，坐标用 CSS px（fixed 定位） */
const mark = async (rect, opt) => {
  await page.evaluate(({ rect, opt }) => {
    const b = document.createElement('div');
    b.className = 'gb-box';
    b.style.cssText = `left:${rect.x}px;top:${rect.y}px;width:${rect.w}px;height:${rect.h}px;
      border:${opt.width || 2}px ${opt.dashed === false ? 'solid' : 'dashed'} ${opt.color};border-radius:${opt.radius || 4}px`;
    document.body.appendChild(b);
    if (opt.label) {
      const l = document.createElement('div');
      l.className = 'gb-lbl ' + (opt.tone || '');
      l.textContent = opt.label;
      const lx = Math.max(4, Math.min(rect.x + (opt.lx ?? 0), 390 - 110));
      const ly = Math.max(4, rect.y + (opt.ly ?? rect.h + 5));
      l.style.cssText = `left:${lx}px;top:${ly}px`;
      document.body.appendChild(l);
    }
  }, { rect, opt });
};

const shot = async (clip, name) => {
  await page.waitForTimeout(160);
  await page.screenshot({ path: `${OUT}/${name}.png`, clip, scale: 'device' });
};

const rectOf = async (sel) => {
  const el = await page.$(sel);
  if (!el) throw new Error('未找到 ' + sel);
  return el.boundingBox();
};

/* ── 1. 触摸目标：视觉 24 vs 命中区 44 ───────────────────────── */
async function caseHitArea() {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2800);
  await inject();

  const b = await rectOf('[aria-label="增加一份"]');
  const cx = b.x + b.width / 2;
  const cy = b.y + b.height / 2;

  // 视觉尺寸（红虚线，实心按钮本身）
  await mark({ x: b.x, y: b.y, w: b.width, h: b.height }, { color: '#FC5294', width: 1.5, radius: 8 });
  // 命中区（青柠虚线 44×44，来自 .gb-hit::after 的 max(100%, 44px)）
  await mark({ x: cx - 22, y: cy - 22, w: 44, h: 44 }, { color: '#54801A', width: 2, radius: 10 });

  await page.evaluate(({ cx, cy }) => {
    /* 标签一律放控件**左下方**：加号在右边缘（cx≈355），往右放会顶出 390 被裁 */
    const a = document.createElement('div');
    a.className = 'gb-lbl pink';
    a.textContent = '视觉 24×24';
    a.style.cssText = `left:150px;top:${cy + 34}px`;
    document.body.appendChild(a);
    const c = document.createElement('div');
    c.className = 'gb-lbl lime';
    c.textContent = '命中区 44×44（::after）';
    c.style.cssText = `left:150px;top:${cy + 56}px`;
    document.body.appendChild(c);
  }, { cx, cy });

  await shot({ x: 140, y: cy - 52, width: 248, height: 142 }, '01-hitarea');
  await clear();
}

/* ── 2. 焦点环：before / after ──────────────────────────────── */
async function caseFocus() {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2800);
  await inject();

  const b = await rectOf('#filter-all-btn');
  const clip = { x: Math.max(0, b.x - 34), y: b.y - 22, width: b.width + 168, height: b.height + 70 };

  // BEFORE：模拟「没有全局 :focus-visible」的状态
  await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    el.style.outline = 'none';
    el.focus();
  }, '#filter-all-btn');
  await page.evaluate(({ b }) => {
    const l = document.createElement('div');
    l.className = 'gb-lbl';
    l.textContent = '改前：无焦点环，键盘用户看不出停在哪';
    l.style.cssText = `left:${Math.max(6, b.x - 18)}px;top:${b.y + b.height + 8}px`;
    document.body.appendChild(l);
  }, { b });
  await shot(clip, '02-focus-before');
  await clear();

  // AFTER：真实规则（index.css 全局 :focus-visible { outline: 2px solid #070906; offset 2px }）
  await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    el.style.outline = '';
    el.focus();
    // 补一次真正的 keyboard modality，让 :focus-visible 命中
  }, '#filter-all-btn');
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  await page.evaluate(({ b }) => {
    const l = document.createElement('div');
    l.className = 'gb-lbl lime';
    l.textContent = '改后：2px 深墨 + 2px 外扩';
    l.style.cssText = `left:${Math.max(6, b.x - 18)}px;top:${b.y + b.height + 8}px`;
    document.body.appendChild(l);
  }, { b });
  await shot(clip, '03-focus-after');
  await clear();
}

/* ── 3. 对比度：禁用态两档 ─────────────────────────────────── */
async function caseContrast() {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2800);
  await page.click('#nav-tab-gacha', { force: true });
  await page.waitForTimeout(2600);
  await inject();

  const sel = '#btn-pantry-delivery-threshold';
  const b = await rectOf(sel);

  // BEFORE：旧值 slate-400
  await page.evaluate((s) => {
    const el = document.querySelector(s);
    el.dataset.old = el.getAttribute('style') || '';
    el.style.background = '#94A3B8';
    el.style.color = '#FFFFFF';
  }, sel);
  await page.evaluate(({ b }) => {
    const l = document.createElement('div');
    l.className = 'gb-lbl pink';
    l.textContent = '#94A3B8 · 白字 2.56:1 不合格';
    l.style.cssText = `left:${Math.max(4, b.x - 8)}px;top:${b.y - 26}px`;
    document.body.appendChild(l);
  }, { b });
  await shot({ x: b.x - 16, y: b.y - 34, width: b.width + 32, height: b.height + 50 }, '04-contrast-before');
  await clear();

  // AFTER：真实值 slate-600
  await page.evaluate((s) => {
    const el = document.querySelector(s);
    el.style.background = '';
    el.style.color = '';
  }, sel);
  await page.evaluate(({ b }) => {
    const l = document.createElement('div');
    l.className = 'gb-lbl lime';
    l.textContent = '#475569 · 白字 7.58:1 通过 AA';
    l.style.cssText = `left:${Math.max(4, b.x - 8)}px;top:${b.y - 26}px`;
    document.body.appendChild(l);
  }, { b });
  await shot({ x: b.x - 16, y: b.y - 34, width: b.width + 32, height: b.height + 50 }, '05-contrast-after');
  await clear();
}

/* ── 4. 品牌取舍：玫红价格 3.10:1 ─────────────────────────── */
async function casePrice() {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2800);
  await inject();

  // 点餐页第一张卡的价格
  const box = await page.evaluate(() => {
    const spans = [...document.querySelectorAll('span')].filter(
      (s) => /^\d+(\.\d+)?$/.test((s.textContent || '').trim()) && s.className.includes('font-black')
    );
    const s = spans[0];
    if (!s) return null;
    const r = s.getBoundingClientRect();
    const card = s.closest('div.group, div') || s;
    const cr = card.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height, cardTop: cr.y };
  });
  if (!box) throw new Error('未找到价格元素');

  await mark({ x: box.x - 10, y: box.y - 8, w: box.w + 26, h: box.h + 16 }, { color: '#FC5294', width: 1.5, radius: 6 });
  await page.evaluate(({ box }) => {
    const a = document.createElement('div');
    a.className = 'gb-lbl pink';
    a.textContent = '#FC5294 · 3.10:1';
    a.style.cssText = `left:${Math.max(4, box.x - 12)}px;top:${box.y + box.h + 8}px`;
    document.body.appendChild(a);
    const c = document.createElement('div');
    c.className = 'gb-lbl';
    c.textContent = '低于 AA 4.5:1 · 显式取舍';
    c.style.cssText = `left:${Math.max(4, box.x - 12)}px;top:${box.y + box.h + 32}px`;
    document.body.appendChild(c);
  }, { box });

  /* 高度要装下「价格 + 两个标签」：box.h(≈17) + 上下留白 + 标签两行。
     给少了第二个标签会被裁掉（试过 box.h+62，标签只剩一个）。 */
  await shot({ x: Math.max(0, box.x - 28), y: box.y - 20, width: 286, height: box.h + 80 }, '06-price-tradeoff');
  await clear();
}

const results = [];
for (const [name, fn] of [
  ['01 触摸目标', caseHitArea],
  ['02 焦点环', caseFocus],
  ['03 对比度', caseContrast],
  ['04 价格取舍', casePrice],
]) {
  try {
    await fn();
    results.push(`${name}: OK`);
  } catch (e) {
    results.push(`${name}: FAIL ${String(e.message || e).split('\n')[0]}`);
  }
}

await browser.close();
fs.writeFileSync(`${OUT}/_log.txt`, results.join('\n'), 'utf8');
