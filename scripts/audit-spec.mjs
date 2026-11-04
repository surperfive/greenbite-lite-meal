/**
 * 静态规范对账（对照 docs/ui-spec.md）
 *
 * 和 audit-ui.mjs 的分工：
 *   audit-ui.mjs   → 运行时（浏览器里量对比度/命中区/溢出），管"看起来对不对"
 *   audit-spec.mjs → 源码，管"写的是不是规范里的那个值"
 * 两者都要跑，一个查结果、一个查源头。
 *
 * 用法：node scripts/audit-spec.mjs [--json]
 * 输出：outputs/audit/spec-audit.json
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');
const OUT_DIR = path.join(ROOT, 'outputs', 'audit');

/* ---------------- 规范常量（改这里等于改规范，同步 docs/ui-spec.md） ---------------- */

/** 2.1 字号阶 */
const TYPE_SCALE = [9, 10, 11, 12, 13, 14, 15, 17, 21, 22, 26];

/** 1.x 已登记色板：值 → 语义。未登记的一律提示。 */
const PALETTE = {
  '#C7F665': 'lime-400 主色',
  '#B7EF4B': 'lime-500 hover',
  '#E4F8BC': 'lime-100 胶囊底',
  '#F2FCE0': 'lime-50 底纹',
  '#54801A': 'lime-700 白底绿字',
  '#26430B': 'lime-900 青柠底字',
  '#FC5294': '品牌玫红（唯一）',
  '#070906': '深墨（正文/黑块）',
  '#FFFFFF': '纯白',
  '#F4F6F8': '页面底色',
  '#0F172A': 'slate-900 正文备选',
  '#94A3B8': 'slate-400 仅图标',
};

/**
 * 允许存在但不参与统一的值：3D/插画/光效自带配色（规范 1.4 第二条），
 * 以及抽卡页的立体卡结构色。这些只在**这些文件**里豁免。
 */
const EXEMPT_FILES = ['GachaPage.tsx', 'GachaBurstReveal.tsx', 'FoodCloche3D.tsx', 'StickerModal.tsx'];

/** 字号豁免：展示型大数字（抽卡结果、贴纸卡标题）不属于正文层级 */
const EXEMPT_TYPE_FILES = ['GachaPage.tsx', 'GachaBurstReveal.tsx', 'StickerModal.tsx'];

/* ---------------- 工具 ---------------- */

const glob = (dir, exts = ['.tsx', '.ts', '.css'], acc = []) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) glob(p, exts, acc);
    else if (exts.some((x) => e.name.endsWith(x))) acc.push(p);
  }
  return acc;
};

const files = glob(SRC);
const rel = (p) => path.relative(ROOT, p).replace(/\\/g, '/');
const hexOf = (r, g, b) => '#' + [r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('').toUpperCase();
const parseHex = (h) => {
  const s = h.replace('#', '');
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
};
const dist = (a, b) => {
  const [x, y, z] = parseHex(a);
  const [p, q, r] = parseHex(b);
  return Math.sqrt((x - p) ** 2 + (y - q) ** 2 + (z - r) ** 2);
};

const findings = { type: [], size9: [], half: [], color: [], spacing: [], border: [], img: [], misc: [] };
const hexUse = new Map(); // '#RRGGBB' -> [{file,line}]
const strip = (s) => s.trim().slice(0, 110);

for (const f of files) {
  const name = path.basename(f);
  const text = fs.readFileSync(f, 'utf8');
  const lines = text.split('\n');

  lines.forEach((line, i) => {
    const lineNo = i + 1;

    /* 跳过整行注释：`*` / `//` 开头，以及 JSX 注释行里出现大段说明的情况。
       不做完美解析，只避免把规范说明文字本身报成违规。 */
    const trimmed = line.trim();
    const isComment = trimmed.startsWith('*') || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('{/*');

    // R1 字号阶
    for (const m of line.matchAll(/text-\[(\d+(?:\.\d+)?)px\]/g)) {
      const v = Number(m[1]);
      if (!TYPE_SCALE.includes(v)) {
        const rec = { file: rel(f), line: lineNo, value: v };
        if (EXEMPT_TYPE_FILES.includes(name)) rec.exempt = true;
        if (v < 9) findings.size9.push(rec);
        else if (!Number.isInteger(v)) findings.half.push(rec);
        else findings.type.push(rec);
      }
    }

    // R2 色值
    if (!isComment) {
      for (const m of line.matchAll(/#([0-9A-Fa-f]{6})\b/g)) {
        const key = '#' + m[1].toUpperCase();
        if (!hexUse.has(key)) hexUse.set(key, []);
        hexUse.get(key).push({ file: rel(f), line: lineNo });
      }
    }

    // R3 间距：抓 p/m/gap/space 的任意值，标记非规范档（规范列 4/6/8/10/12/14/16/20/24）
    if (!isComment) {
      const SPACE_OK = [0, 1, 2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 28, 32, 40, 44, 48];
      for (const m of line.matchAll(/(?:^|[\s"'])(p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|gap|gap-x|gap-y|space-x|space-y)-\[(\d+(?:\.\d+)?)px\]/g)) {
        const v = Number(m[2]);
        if (!SPACE_OK.includes(v)) {
          findings.spacing.push({ file: rel(f), line: lineNo, cls: `${m[1]}-[${v}px]`, snippet: strip(line) });
        }
      }
    }

    // R4 描边粗细：规范只有 1.5 / 2
    if (!isComment) {
      for (const m of line.matchAll(/border-\[(\d+(?:\.\d+)?)px\]/g)) {
        const v = Number(m[1]);
        if (![1.5, 2].includes(v)) {
          findings.border.push({ file: rel(f), line: lineNo, value: v, snippet: strip(line) });
        }
      }
    }

  });

  // R5 img 缺 loading / alt —— 必须**跨行**匹配整个标签：
  //    多行 <img\n src=...\n alt=...> 若只按单行判断，会把有 alt 的标签误报成缺 alt。
  //    ⚠️ 不能用 /<img[\s\S]*?>/ 偷懒：`ref={(node) => {` 里的 `=>` 会被当成标签结束符，
  //       正好把这个组件的 alt（在 ref 回调之后）切掉 —— 第一版就是这么误报 DishImage 的。
  //       所以改成扫描 `{...}` 深度、跳过引号，只在深度 0 且非 `=>` 的 `>` 处收尾。
  for (let at = text.indexOf('<img'); at !== -1; at = text.indexOf('<img', at + 4)) {
    const end = scanJsxTag(text, at);
    if (end < 0) continue;
    const tag = text.slice(at, end + 1);
    const lineNo = text.slice(0, at).split('\n').length;
    const lineText = lines[lineNo - 1] || '';
    if (/^\s*(\*|\/\/|\/\*)/.test(lineText)) continue; // 注释里的示例代码不算
    const noAlt = !/\balt\s*=/.test(tag);
    const noLazy = !/\bloading\s*=/.test(tag);
    if (noAlt || noLazy) {
      findings.img.push({ file: rel(f), line: lineNo, noAlt, noLazy, snippet: strip(tag.replace(/\s+/g, ' ')) });
    }
  }
}

/** 从 `<img` 起找到 JSX 标签真正结束的 `>` 下标；处理 {...} 嵌套、引号、`=>` */
function scanJsxTag(text, start) {
  let depth = 0;
  let quote = null;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (quote) {
      if (c === quote && text[i - 1] !== '\\') quote = null;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { quote = c; continue; }
    if (c === '{') depth++;
    else if (c === '}') depth--;
    else if (c === '>' && depth === 0) {
      if (text[i - 1] === '=') continue; // 箭头函数 `=>`，不是标签结束
      return i;
    }
  }
  return -1;
}

/* ---------------- 色值聚类：找"差了 1~3 个色阶"的手滑值 ---------------- */
const allHex = [...hexUse.keys()].filter((h) => hexUse.get(h).length > 0);
const clusters = [];
const seen = new Set();
for (const a of allHex) {
  if (seen.has(a)) continue;
  const group = allHex.filter((b) => dist(a, b) <= 10);
  group.forEach((g) => seen.add(g));
  if (group.length > 1) {
    clusters.push(
      group
        .map((h) => ({ hex: h, count: hexUse.get(h).length, registered: !!PALETTE[h] }))
        .sort((x, y) => y.count - x.count),
    );
  }
}

/* ---------------- 未登记色值 ---------------- */
const unregistered = allHex
  .filter((h) => !PALETTE[h])
  .map((h) => ({
    hex: h,
    count: hexUse.get(h).length,
    files: [...new Set(hexUse.get(h).map((u) => u.file))],
    exemptOnly: hexUse.get(h).every((u) => EXEMPT_FILES.includes(path.basename(u.file))),
  }))
  .sort((a, b) => b.count - a.count);

/* ---------------- 输出 ---------------- */
const report = {
  generatedAt: new Date().toISOString(),
  files: files.length,
  typeScale: TYPE_SCALE,
  findings,
  nearDuplicates: clusters.filter((c) => c.length > 1),
  unregistered,
};

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, 'spec-audit.json'), JSON.stringify(report, null, 2));

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(report, null, 2));
} else {
  const groupByFile = (arr) => {
    const m = new Map();
    arr.forEach((r) => {
      m.set(r.file, (m.get(r.file) || 0) + 1);
    });
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  };

  console.log(`\n规范对账 · ${files.length} 个源文件\n${'='.repeat(58)}`);

  console.log(`\n[R1] 字号 < 9px（规范明令禁止）: ${findings.size9.length}`);
  groupByFile(findings.size9).forEach(([f, n]) => console.log(`   ${f}  ×${n}`));

  console.log(`\n[R2] 字号不在阶上: ${findings.type.length}`);
  groupByFile(findings.type).forEach(([f, n]) => console.log(`   ${f}  ×${n}`));
  const vals = [...new Set(findings.type.map((r) => r.value))].sort((a, b) => a - b);
  if (vals.length) console.log(`   值: ${vals.join(' / ')}`);

  console.log(`\n[R3] 半像素字号: ${findings.half.length}`);
  findings.half.slice(0, 8).forEach((r) => console.log(`   ${r.file}:${r.line}  ${r.value}px`));

  console.log(`\n[R4] 间距非规范档: ${findings.spacing.length}`);
  const sp = new Map();
  findings.spacing.forEach((r) => sp.set(r.cls, (sp.get(r.cls) || 0) + 1));
  [...sp.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([c, n]) => console.log(`   ${c}  ×${n}`));

  console.log(`\n[R5] 描边粗细非 1.5/2: ${findings.border.length}`);
  findings.border.slice(0, 8).forEach((r) => console.log(`   ${r.file}:${r.line}  ${r.value}px`));

  console.log(`\n[R6] img 缺 alt / loading: ${findings.img.length}`);
  const imgStat = { noAlt: findings.img.filter((r) => r.noAlt).length, noLazy: findings.img.filter((r) => r.noLazy).length };
  console.log(`   缺 alt ${imgStat.noAlt} · 缺 loading ${imgStat.noLazy}`);

  console.log(`\n[C1] 近似色簇（同一语义手滑成多值）: ${report.nearDuplicates.length}`);
  report.nearDuplicates.slice(0, 6).forEach((c) => {
    console.log('   ' + c.map((x) => `${x.hex}(${x.count}${x.registered ? '' : '✗'})`).join('  ≈  '));
  });

  console.log(`\n[C2] 未登记色值: ${unregistered.filter((u) => !u.exemptOnly).length} 个（不含插画豁免）`);
  unregistered
    .filter((u) => !u.exemptOnly)
    .slice(0, 12)
    .forEach((u) => console.log(`   ${u.hex}  ×${u.count}  ${u.files.slice(0, 3).join(', ')}`));

  console.log(`\n→ outputs/audit/spec-audit.json\n`);
}
