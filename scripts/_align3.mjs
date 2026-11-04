import { chromium } from 'playwright';
import fs from 'fs';

const OUT = 'outputs/align2';
fs.mkdirSync(OUT, { recursive: true });
const BASE = 'http://127.0.0.1:5173/';

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });

const collect = () =>
  page.evaluate(() => {
    const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
    const isPill = (el) => {
      const cs = getComputedStyle(el);
      const r = parseFloat(cs.borderTopLeftRadius) || 0;
      const padX = parseFloat(cs.paddingLeft) || 0;
      return r >= 9 && padX >= 4;
    };
    const rows = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const seen = new Set();
    let n;
    while ((n = walker.nextNode())) {
      const t = norm(n.textContent);
      if (!t) continue;
      const el = n.parentElement;
      if (!el || seen.has(el)) continue;
      seen.add(el);
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none') continue;
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      if (r.bottom < 0 || r.top > 844) continue;
      if (r.left < 0 || r.right > 390) continue;
      // 只有真正渲染文字的元素才量：元素内不能再有其它含文字的子元素
      const kids = [...el.children].filter((c) => norm(c.textContent).length > 0 && c.getBoundingClientRect().width > 0);
      if (kids.length > 0 && el.children.length > 0 && kids.length === el.children.length) continue;

      // 找最近的「胶囊 / 标签」祖先
      let pill = null;
      let p = el;
      for (let i = 0; i < 4 && p && p !== document.body; i++) {
        if (isPill(p) && p !== el) { pill = p; break; }
        p = p.parentElement;
      }
      const pillRect = pill ? pill.getBoundingClientRect() : null;
      const padL = pill ? parseFloat(getComputedStyle(pill).paddingLeft) : 0;

      // 用 Range 量真实文字墨迹盒（比元素盒准，元素可能有额外 padding）
      const rg = document.createRange();
      rg.selectNodeContents(el);
      const ink = rg.getBoundingClientRect();

      rows.push({
        text: t.slice(0, 22),
        tag: el.tagName.toLowerCase(),
        font: Math.round(parseFloat(cs.fontSize) * 10) / 10,
        weight: cs.fontWeight,
        x: Math.round(ink.left * 10) / 10,
        r: Math.round(ink.right * 10) / 10,
        y: Math.round(r.top),
        h: Math.round(r.height),
        cy: Math.round((r.top + r.bottom) / 2),
        elX: Math.round(r.left * 10) / 10,
        elW: Math.round(r.width),
        pill: pill ? { x: Math.round(pillRect.left), w: Math.round(pillRect.width), padL } : null,
        cls: (el.className || '').toString().slice(0, 90),
      });
    }
    return { scrollW: document.documentElement.scrollWidth, rows };
  });

const gotoTab = async (tab) => {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2600);
  if (tab && tab !== 'menu') {
    await page.click(`#nav-tab-${tab}`, { force: true });
    await page.waitForTimeout(2400);
  }
};

const pages = ['home', 'menu', 'gacha', 'orders', 'me'];
const all = {};
for (const t of pages) {
  await gotoTab(t);
  all[t] = await collect();
  await page.screenshot({ path: `${OUT}/${t}.png` });
}

// 汇总：按「行」聚类，看每行有哪些不同的左缘
const report = [];
for (const t of pages) {
  const { rows, scrollW } = all[t];
  const byRow = new Map();
  for (const r of rows) {
    const key = Math.round(r.cy / 6) * 6;
    if (!byRow.has(key)) byRow.set(key, []);
    byRow.get(key).push(r);
  }
  report.push(`===== ${t}  scrollW=${scrollW}  texts=${rows.length} =====`);
  const keys = [...byRow.keys()].sort((a, b) => a - b);
  for (const k of keys) {
    const g = byRow.get(k).sort((a, b) => a.x - b.x);
    if (g.length < 2) continue;
    const xs = [...new Set(g.map((r) => r.x))];
    // 只报「同一行里左缘不一致」的情况
    if (xs.length > 1) {
      report.push(`  y≈${k}: ` + g.map((r) => `[${r.x}→${r.r}] "${r.text}"${r.pill ? ` (pill@${r.pill.x} p${r.pill.padL})` : ''}`).join('  |  '));
    }
  }
}

fs.writeFileSync(`${OUT}/rows.txt`, report.join('\n'), 'utf8');
fs.writeFileSync(`${OUT}/raw.json`, JSON.stringify(all, null, 1), 'utf8');
await browser.close();
console.log('ok');
