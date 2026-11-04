/**
 * 图标合集导出
 * ------------------------------------------------------------------
 * 打开 scripts/export-icons.html（Vite 直接服务，真实 lucide 组件挂载），然后：
 *   1) 整页截图 → exports/icon-set/图标合集.png
 *   2) 逐个图标序列化 → exports/icon-set/icons/<code>-<Name>.svg
 *   3) 拼装单文件矢量 → exports/icon-set/图标合集.svg
 *   4) 写 MANIFEST.md（含"只导入未使用"的残留清单）
 *
 * 用法：node scripts/_export-icons.mjs
 * 前提：dev server 在 5173；清单来自 `scripts/icon-inventory.json`（见文件末尾生成命令）
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { BASE } from './_base.mjs';

const OUT = 'exports/icon-set';
const ICONS = path.join(OUT, 'icons');
fs.mkdirSync(ICONS, { recursive: true });

/* 必须连根 <svg> 的 presentation 属性一起搬走：lucide 把
   stroke="currentColor" / stroke-width / stroke-linecap 写在**根**上，path 里没有。 */
const PRESENTATION = [
  'fill', 'fill-rule', 'clip-rule', 'stroke', 'stroke-width', 'stroke-linecap',
  'stroke-linejoin', 'stroke-miterlimit', 'stroke-dasharray',
  'fill-opacity', 'stroke-opacity', 'opacity', 'color',
];

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1600, height: 1200 }, deviceScaleFactor: 2 });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(String(e)));

await page.goto(`${BASE}/scripts/export-icons.html`, { waitUntil: 'networkidle' });
await page.waitForSelector('[data-code]', { timeout: 20000 });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(400);

if (errors.length) console.warn('页面报错:', errors);

const sheetBox = await page.evaluate(() => {
  const r = document.getElementById('root').firstElementChild.getBoundingClientRect();
  return { w: r.width, h: r.height };
});
console.log('sheet', JSON.stringify(sheetBox));

/* ---------- 1) 合集图 ---------- */
// ⚠️ clip 不会越过视口，先把视口撑到版面高度
await page.setViewportSize({ width: 1600, height: Math.ceil(sheetBox.h) });
await page.waitForTimeout(200);
await page.screenshot({
  path: path.join(OUT, '图标合集.png'),
  clip: { x: 0, y: 0, width: sheetBox.w, height: sheetBox.h },
});
console.log('png ok');

/* ---------- 2) 逐枚序列化 ---------- */
const cells = await page.$$eval('[data-code]', (nodes, PRESENTATION) =>
  nodes.map((n) => {
    const svg = n.querySelector('svg');
    const attrs = {};
    if (svg) for (const a of PRESENTATION) {
      const v = svg.getAttribute(a);
      if (v !== null) attrs[a] = v;
    }
    return {
      code: n.dataset.code,
      name: n.dataset.name,
      refs: n.dataset.refs,
      files: n.dataset.files,
      color: svg ? getComputedStyle(svg).color : '#000',
      viewBox: svg ? svg.getAttribute('viewBox') : null,
      attrs,
      inner: svg ? svg.innerHTML : null,
    };
  }),
  PRESENTATION
);

const standalone = ({ viewBox, inner, color, attrs }) => {
  const [vx, vy, vw, vh] = viewBox.trim().split(/[\s,]+/).map(Number);
  const long = 256;
  const w = vw >= vh ? long : Math.round((long * vw) / vh);
  const h = vw >= vh ? Math.round((long * vh) / vw) : long;
  const rootAttrs = Object.entries(attrs)
    .map(([k, v]) => ` ${k}="${String(v).replace(/currentColor/g, color)}"`)
    .join('');
  const body = inner.replace(/currentColor/g, color).replace(/\sclass="[^"]*"/g, '');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${viewBox}"${rootAttrs}>\n${body}\n</svg>\n`;
};

const vector = [];
for (const c of cells) {
  if (!c.viewBox) { console.warn('无 svg，跳过', c.code, c.name); continue; }
  const file = `${c.code}-${c.name}.svg`;
  fs.writeFileSync(path.join(ICONS, file), standalone(c));
  vector.push({ ...c, file: `icons/${file}`, inner: c.inner.replace(/currentColor/g, c.color).replace(/\sclass="[^"]*"/g, '') });
}
console.log('svg', vector.length, '个');

/* ---------- 3) 单文件矢量合集 ---------- */
const COLS = 8, CW = 166, CH = 118, GAP = 12, PAD = 64, HEADER = 210;
const gridW = COLS * CW + (COLS - 1) * GAP;
const rows = Math.ceil(vector.length / COLS);
const H = PAD + HEADER + rows * CH + (rows - 1) * GAP + PAD;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const nsIds = (html, p) =>
  html
    .replace(/id="([^"]+)"/g, (_, id) => `id="${p}-${id}"`)
    .replace(/url\(#([^)]+)\)/g, (_, id) => `url(#${p}-${id})`)
    .replace(/xlink:href="#([^"]+)"/g, (_, id) => `xlink:href="#${p}-${id}"`)
    .replace(/href="#([^"]+)"/g, (_, id) => `href="#${p}-${id}"`);

const cellsSvg = vector.map((v, i) => {
  const col = i % COLS, row = Math.floor(i / COLS);
  const cx = PAD + col * (CW + GAP);
  const cy = PAD + HEADER + row * (CH + GAP);
  const [vx, vy, vw, vh] = v.viewBox.trim().split(/[\s,]+/).map(Number);
  const boxW = 48, boxH = 48;
  const s = Math.min(boxW / vw, boxH / vh);
  const w = vw * s, h = vh * s;
  const x = cx + (CW - w) / 2;
  const y = cy + 14 + (boxH - h) / 2;
  const attrStr = Object.entries(v.attrs || {})
    .map(([k, val]) => ` ${k}="${String(val).replace(/&/g, '&amp;').replace(/"/g, '&quot;')}"`)
    .join('');
  return `
  <g>
    <rect x="${cx}" y="${cy}" width="${CW}" height="${CH}" rx="16" fill="#FFFFFF" stroke="#E6EAEE"/>
    <svg x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${w.toFixed(2)}" height="${h.toFixed(2)}" viewBox="${v.viewBox}"${attrStr}>${nsIds(v.inner, v.code)}</svg>
    <text x="${cx + CW / 2}" y="${cy + 84}" text-anchor="middle" font-family="ui-monospace,monospace" font-size="9.5" font-weight="700" fill="#0B0F14">${esc(v.name)}</text>
    <text x="${cx + CW / 2}" y="${cy + 99}" text-anchor="middle" font-family="ui-monospace,monospace" font-size="8.5" fill="#9AA4B0">${v.refs ? v.refs + ' refs' : esc(v.code)}</text>
  </g>`;
}).join('');

const combined = `<svg xmlns="http://www.w3.org/2000/svg" width="${gridW + PAD * 2}" height="${H}" viewBox="0 0 ${gridW + PAD * 2} ${H}">
  <rect width="100%" height="100%" fill="#F4F6F8"/>
  <text x="${PAD}" y="${PAD + 30}" font-family="PingFang SC,Microsoft YaHei,sans-serif" font-size="13" font-weight="700" letter-spacing="3" fill="#54801A">ICON SET</text>
  <text x="${PAD}" y="${PAD + 92}" font-family="PingFang SC,Microsoft YaHei,sans-serif" font-size="54" font-weight="900" fill="#0B0F14">图标合集</text>
  <text x="${PAD}" y="${PAD + 124}" font-family="PingFang SC,Microsoft YaHei,sans-serif" font-size="15" fill="#5B6472">轻食点餐小程序 · 界面图标全量 · 共 ${vector.length} 枚</text>
  <line x1="${PAD}" y1="${PAD + 156}" x2="${gridW + PAD}" y2="${PAD + 156}" stroke="#0B0F14" stroke-width="2"/>
  ${cellsSvg}
</svg>
`;
fs.writeFileSync(path.join(OUT, '图标合集.svg'), combined);
console.log('combined svg ok');

/* ---------- 4) MANIFEST ---------- */
const inv = JSON.parse(fs.readFileSync('scripts/icon-inventory.json', 'utf8'));
const unused = inv.filter((i) => i.refs === 0);
const lucideRows = vector.filter((v) => v.code.startsWith('L'));
const customRows = vector.filter((v) => !v.code.startsWith('L'));

const table = (rows) =>
  rows.map((r) => `| \`${r.code}\` | ${r.name} | ${r.refs || '—'} | \`${r.file}\` |`).join('\n');

fs.writeFileSync(path.join(OUT, 'MANIFEST.md'), `# 图标合集 · 导出清单

轻食点餐小程序（remix-greenbite）界面图标全量，共 **${vector.length}** 枚
（线性 ${lucideRows.length} + 自有 ${customRows.length}）。
由 \`scripts/_export-icons.mjs\` 从**真实组件**渲染后序列化，非手绘复制。

## 文件

- \`图标合集.png\` —— 排版好的合集图（${sheetBox.w}×${Math.round(sheetBox.h)} css，@dpr2 实际约 ${sheetBox.w * 2}px 宽）
- \`图标合集.svg\` —— 单文件矢量合集，可在设计工具里逐个取用
- \`icons/\` —— 每枚图标一个独立 SVG（24×24 网格，256px 导出）

## 线性图标（lucide-react，${lucideRows.length} 枚）

统一规格：24×24 网格 · \`stroke-width: 1.6\` · 圆头端点 · \`currentColor\`
（导出文件已把 currentColor 固化为 \`#0B0F14\`，需要换色直接改 \`stroke\`）

| 编号 | 图标 | 引用次数 | 文件 |
|---|---|---|---|
${table(lucideRows)}

## 自有图标（${customRows.length} 枚）

| 编号 | 图标 | 引用次数 | 文件 |
|---|---|---|---|
${table(customRows)}

## ⚠️ 只导入、未使用（${unused.length} 枚，未收录）

这些图标在各组件里 \`import\` 了但没有任何引用，属于**残留导入**，建议清理：

${unused.map((u) => `- \`${u.name}\` — ${u.files.join('、')}`).join('\n')}

## 范围说明

- 本合集只收**界面图标**。品牌标志（主标 / 吉祥物 / 抽卡币皇冠 / 9折气泡）与 6 枚分类图标
  见 \`exports/brand-marks/\`。
- 图片素材（首页入口插画、抽卡食材）不属于图标，未收录。

## 重新导出

\`\`\`bash
# 1) 重新扫描源码里的图标引用
python - <<'PY'
import re, pathlib, json, collections
root = pathlib.Path('src')
files = sorted(list(root.rglob('*.tsx')) + list(root.rglob('*.ts')))
imp = re.compile(r"import\\s*\\{([^}]*)\\}\\s*from\\s*['\\"]lucide-react['\\"]", re.S)
imported = collections.defaultdict(set); stripped = {}
for f in files:
    s = f.read_text(encoding='utf-8'); stripped[f.as_posix()] = imp.sub('', s)
    for m in imp.finditer(s):
        for part in m.group(1).split(','):
            part = part.strip()
            if part: imported[part.split(' as ')[0].strip()].add(f.as_posix())
out = []
for name in sorted(imported):
    refs = sum(len(re.findall(r'\\b' + re.escape(name) + r'\\b', s)) for s in stripped.values())
    out.append({'name': name, 'files': sorted(imported[name]),
                'fileCount': len(imported[name]), 'refs': refs, 'source': 'lucide-react'})
pathlib.Path('scripts/icon-inventory.json').write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding='utf-8')
PY

# 2) 重新导出
node scripts/_export-icons.mjs
\`\`\`
`);

console.log('manifest ok');
await browser.close();
console.log('\nDONE →', OUT);
