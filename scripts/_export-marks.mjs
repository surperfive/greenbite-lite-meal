/**
 * 标志合集导出
 * ------------------------------------------------------------------
 * 打开 scripts/export-marks.html（Vite 直接服务，真实组件挂载），然后：
 *   1) 整页截图 → exports/brand-marks/标志合集.png（dpr2）
 *   2) 逐个标志序列化 → exports/brand-marks/marks/<code>-<slug>.svg
 *   3) 位图标志直接复制原文件
 *   4) 拼装单文件矢量 → exports/brand-marks/标志合集.svg
 *   5) 写 MANIFEST.md（清单 + 来源组件 + 品牌色）
 *
 * 用法：node scripts/_export-marks.mjs
 * 前提：dev server 在 5173（`scripts/_base.mjs` 的 BASE）
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { BASE } from './_base.mjs';

const OUT = 'exports/brand-marks';
const MARKS = path.join(OUT, 'marks');
fs.mkdirSync(MARKS, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1600, height: 1200 }, deviceScaleFactor: 2 });
await page.goto(`${BASE}/scripts/export-marks.html`, { waitUntil: 'networkidle' });
await page.waitForSelector('[data-code]', { timeout: 20000 });
// 等字体与内联 SVG 全部就位
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(500);

const sheetBox = await page.evaluate(() => {
  const el = document.getElementById('root').firstElementChild;
  const r = el.getBoundingClientRect();
  return { w: r.width, h: r.height };
});
console.log('sheet', JSON.stringify(sheetBox));

/* ---------- 1) 合集图 ---------- */
// ⚠️ clip 不会自动越过视口：先把视口撑到版面高度，否则截图被腰斩
await page.setViewportSize({ width: 1600, height: Math.ceil(sheetBox.h) });
await page.waitForTimeout(200);
await page.screenshot({
  path: path.join(OUT, '标志合集.png'),
  clip: { x: 0, y: 0, width: sheetBox.w, height: sheetBox.h },
});
console.log('png ok');

/* ---------- 2) 逐枚序列化 ---------- */
// ⚠️ 必须连根 <svg> 上的 presentation 属性一起拿走：CategoryIcons 把
// `stroke="currentColor" stroke-width="1.7"` 写在**根**上、path 里没有，
// 只序列化 innerHTML 会得到一个 fill=none 又无描边的空文件。
const PRESENTATION = [
  'fill', 'fill-rule', 'clip-rule', 'stroke', 'stroke-width', 'stroke-linecap',
  'stroke-linejoin', 'stroke-miterlimit', 'stroke-dasharray',
  'fill-opacity', 'stroke-opacity', 'opacity', 'color',
];

const marks = await page.$$eval('[data-code]', (nodes, PRESENTATION) =>
  nodes.map((n) => {
    const svg = n.querySelector('svg');
    const img = n.querySelector('img');
    const attrs = {};
    if (svg) {
      for (const a of PRESENTATION) {
        const v = svg.getAttribute(a);
        if (v !== null) attrs[a] = v;
      }
    }
    return {
      code: n.dataset.code,
      name: n.dataset.name,
      // ⚠️ 必须读 **svg 自身** 的 color：卡片的 color 继承自 body(#111827)，
      // 而 .c-ink / .c-gold 是挂在 svg 上的，读卡片会拿到错的颜色
      color: svg ? getComputedStyle(svg).color : getComputedStyle(n).color,
      viewBox: svg ? svg.getAttribute('viewBox') : null,
      attrs,
      inner: svg ? svg.innerHTML : null,
      imgSrc: img ? img.getAttribute('src') : null,
    };
  }),
  PRESENTATION
);

const slug = (s) => s.replace(/[\\/:*?"<>|·]/g, '').replace(/\s+/g, '-');

function standalone({ viewBox, inner, color, attrs }) {
  const [vx, vy, vw, vh] = viewBox.trim().split(/[\s,]+/).map(Number);
  const long = 512;
  const w = vw >= vh ? long : Math.round((long * vw) / vh);
  const h = vw >= vh ? Math.round((long * vh) / vw) : long;
  // currentColor 在独立文件里没有上下文，替换成组件实际渲染出的颜色
  const rootAttrs = Object.entries(attrs)
    .map(([k, v]) => ` ${k}="${String(v).replace(/currentColor/g, color)}"`)
    .join('');
  // 组件里的 class 指向 index.css 的加载动画，独立文件里没有意义，去掉
  const body = inner.replace(/currentColor/g, color).replace(/\sclass="[^"]*"/g, '');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${viewBox}"${rootAttrs}>\n${body}\n</svg>\n`;
}

const manifest = [];
const vector = [];
let rasterCount = 0;
for (const m of marks) {
  const base = `${m.code}-${slug(m.name)}`;
  if (m.viewBox) {
    fs.writeFileSync(path.join(MARKS, `${base}.svg`), standalone(m));
    manifest.push({ ...m, file: `marks/${base}.svg`, kind: '矢量 SVG' });
    vector.push({
      code: m.code, name: m.name, viewBox: m.viewBox, attrs: m.attrs,
      inner: m.inner.replace(/currentColor/g, m.color).replace(/\sclass="[^"]*"/g, ''),
    });
  } else if (m.imgSrc) {
    const src = path.join('public', m.imgSrc.replace(/^\//, ''));
    if (fs.existsSync(src)) {
      const ext = path.extname(src);
      fs.copyFileSync(src, path.join(MARKS, `${base}${ext}`));
      manifest.push({ ...m, file: `marks/${base}${ext}`, kind: ext === '.svg' ? '矢量 SVG' : '位图 PNG' });
      if (ext === '.svg') {
        const raw = fs.readFileSync(src, 'utf8');
        const vb = (raw.match(/viewBox="([^"]+)"/) || [])[1];
        const inner = (raw.match(/<svg[^>]*>([\s\S]*)<\/svg>/) || [])[1] || '';
        if (vb) vector.push({ code: m.code, name: m.name, viewBox: vb, attrs: {}, inner });
      } else {
        // 位图也塞进合并 svg（base64 内嵌），这样单文件是完整的 16 枚
        const b64 = fs.readFileSync(src).toString('base64');
        vector.push({
          code: m.code, name: m.name, viewBox: '0 0 256 256', attrs: {}, raster: true,
          inner: `<image href="data:image/png;base64,${b64}" x="0" y="0" width="256" height="256" preserveAspectRatio="xMidYMid meet"/>`,
        });
        rasterCount++;
      }
    } else {
      console.warn('missing raster', src);
    }
  }
}
console.log('marks', manifest.length, '| combined 内嵌', vector.length, `（位图 ${rasterCount}）`);

/* ---------- 4) 单文件矢量合集 ---------- */
const COLS = 4, CW = 340, CH = 300, GAP = 24, PAD = 64, HEADER = 230;
const gridW = COLS * CW + (COLS - 1) * GAP;
const rows = Math.ceil(vector.length / COLS);
const H = PAD + HEADER + rows * CH + (rows - 1) * GAP + PAD;

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const nsIds = (html, p) =>
  html
    .replace(/id="([^"]+)"/g, (_, id) => `id="${p}-${id}"`)
    .replace(/url\(#([^)]+)\)/g, (_, id) => `url(#${p}-${id})`)
    .replace(/xlink:href="#([^"]+)"/g, (_, id) => `xlink:href="#${p}-${id}"`)
    .replace(/href="#([^"]+)"/g, (_, id) => `href="#${p}-${id}"`);

const cells = vector.map((v, i) => {
  const col = i % COLS, row = Math.floor(i / COLS);
  const cx = PAD + col * (CW + GAP);
  const cy = PAD + HEADER + row * (CH + GAP);
  const [vx, vy, vw, vh] = v.viewBox.trim().split(/[\s,]+/).map(Number);
  const boxW = CW - 48, boxH = CH - 110;
  const s = Math.min(boxW / vw, boxH / vh);
  const w = vw * s, h = vh * s;
  const x = cx + (CW - w) / 2;
  const y = cy + 24 + (boxH - h) / 2;
  const attrStr = Object.entries(v.attrs || {})
    .map(([k, val]) => ` ${k}="${String(val).replace(/&/g, '&amp;').replace(/"/g, '&quot;')}"`)
    .join('');
  return `
  <g>
    <rect x="${cx}" y="${cy}" width="${CW}" height="${CH}" rx="22" fill="#FFFFFF" stroke="#E6EAEE"/>
    <svg x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${w.toFixed(2)}" height="${h.toFixed(2)}" viewBox="${v.viewBox}"${attrStr}>${nsIds(v.inner, v.code)}</svg>
    <text x="${cx + 24}" y="${cy + CH - 46}" font-family="ui-monospace,monospace" font-size="11" font-weight="700" fill="#94A3B8">${v.code}</text>
    <text x="${cx + 24}" y="${cy + CH - 26}" font-family="PingFang SC,Microsoft YaHei,sans-serif" font-size="15" font-weight="700" fill="#0B0F14">${esc(v.name)}</text>
  </g>`;
}).join('');

const combined = `<svg xmlns="http://www.w3.org/2000/svg" width="${gridW + PAD * 2}" height="${H}" viewBox="0 0 ${gridW + PAD * 2} ${H}">
  <rect width="100%" height="100%" fill="#F4F6F8"/>
  <text x="${PAD}" y="${PAD + 34}" font-family="PingFang SC,Microsoft YaHei,sans-serif" font-size="13" font-weight="700" letter-spacing="3" fill="#54801A">BRAND MARKS</text>
  <text x="${PAD}" y="${PAD + 96}" font-family="PingFang SC,Microsoft YaHei,sans-serif" font-size="54" font-weight="900" fill="#0B0F14">标志合集</text>
  <text x="${PAD}" y="${PAD + 128}" font-family="PingFang SC,Microsoft YaHei,sans-serif" font-size="15" fill="#5B6472">轻食点餐小程序 · 全部品牌标识与功能图标 · 共 ${vector.length} 枚 · 矢量 ${vector.length - rasterCount} / 位图 ${rasterCount}</text>
  <line x1="${PAD}" y1="${PAD + 160}" x2="${gridW + PAD}" y2="${PAD + 160}" stroke="#0B0F14" stroke-width="2"/>
  ${cells}
</svg>
`;
fs.writeFileSync(path.join(OUT, '标志合集.svg'), combined);
console.log('combined svg ok');

/* ---------- 5) MANIFEST ---------- */
const rowsMd = manifest
  .map((m) => `| ${m.code} | ${m.name} | ${m.kind} | \`${m.file}\` |`)
  .join('\n');

fs.writeFileSync(path.join(OUT, 'MANIFEST.md'), `# 标志合集 · 导出清单

轻食点餐小程序（remix-greenbite）全部品牌标识与功能图标，共 **${manifest.length}** 枚。
导出时间 2026-10-30，由 \`scripts/_export-marks.mjs\` 从**真实组件**渲染后序列化，非手绘复制。

## 文件

| 编号 | 名称 | 类型 | 文件 |
|---|---|---|---|
${rowsMd}

- \`标志合集.png\` —— 排版好的合集图（3120px 宽，dpr2）
- \`标志合集.svg\` —— 单文件矢量合集，可直接在设计工具里打开逐个取用
- \`marks/\` —— 每枚标志一个独立文件

## 品牌色

| 用途 | 色值 |
|---|---|
| 青柠（主色 / 填充描边） | \`#C7F665\` |
| 青柠深（白底可当文字） | \`#54801A\` |
| 玫红（价格 / 促销 / 气泡） | \`#FC5294\` |
| 品牌金（抽卡币 / 高亮） | \`#FDCF29\` |
| 墨黑（文字 / 描边） | \`#0B0F14\` |

## 来源

| 编号 | 来源 |
|---|---|
| A1 | \`src/components/FreshFoodLogo.tsx\` |
| A2 / A3 | \`public/mascot-avatar-hd.svg\` / \`mascot-avatar-crowned.svg\` |
| B1 / B2 | \`src/components/TokenIcon.tsx\` |
| B3 | \`src/components/GachaPage.tsx\` → \`DISCOUNT_BUBBLE_D\` |
| C1–C6 | \`src/components/CategoryIcons.tsx\` |
| D1 | \`src/components/RedPacketFuIcon.tsx\` |
| D2 | \`src/components/HandshakeStitchIcon.tsx\` |
| D3 / D4 | \`public/1b67bdaeb3b2740899ad324d0df7f544.png\` / \`edd0acc180bfd09016dd25d86701cc17.png\` |

## 重新导出

组件改过之后重跑：

\`\`\`bash
node scripts/_export-marks.mjs
\`\`\`

⚠️ 唯一需要手工同步的是 B3 气泡：它的路径在 \`GachaPage.tsx\` 内部（未导出为常量），
\`scripts/export-marks.tsx\` 顶部有一份副本，改那边要同步这里。
`);

console.log('manifest ok');
// 清掉验证用的临时页（`scripts/_verify-marks.mjs` 会再生成）
for (const f of ['_verify.html', '_verify2.html']) {
  const p2 = path.join(OUT, f);
  if (fs.existsSync(p2)) fs.unlinkSync(p2);
}
await browser.close();
console.log('\nDONE →', OUT);
