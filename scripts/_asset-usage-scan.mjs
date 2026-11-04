/**
 * 扫描 public/ 下每个静态资源是否被 src/ + index.html 真实引用。
 *
 * 关键：先剥掉注释再搜 —— 否则「代码注释里提过文件名」会被误判成已引用
 * （历史上 891.mp4 / 893.mp4 就因此逃过了清理）。
 *
 * 输出：
 *  USED    命中完整相对路径 → 打印命中文件与行号
 *  WEAK    只命中 basename → 需人工确认
 *  UNUSED  完全未引用 → 可清理
 *
 * 用法：node scripts/_asset-usage-scan.mjs
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, extname, basename } from 'node:path';

const ROOT = process.cwd();
const PUBLIC = join(ROOT, 'public');

function walk(dir, filter) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git') continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...walk(p, filter));
    else if (filter(p)) out.push(p);
  }
  return out;
}

/** 剥掉 // 与 /* *\/ 注释（不处理字符串内的假注释，够用） */
function stripComments(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}

const srcFiles = walk(join(ROOT, 'src'), (p) =>
  ['.ts', '.tsx', '.css', '.js', '.jsx'].includes(extname(p))
);
srcFiles.push(join(ROOT, 'index.html'));
srcFiles.push(join(ROOT, 'vite.config.ts'));

// 每行一条，便于回报命中位置
const lines = [];
for (const f of srcFiles) {
  let txt = '';
  try {
    txt = stripComments(readFileSync(f, 'utf8'));
  } catch {
    continue;
  }
  const rel = relative(ROOT, f).split('\\').join('/');
  txt.split('\n').forEach((line, i) => lines.push({ file: rel, no: i + 1, line }));
}

/**
 * 带边界断言的查找。
 * 必须做边界判断，否则 `entry-pickup.jpg` 会被 `entry-norm/entry-pickup.png`
 * 这种「同后缀文件名」误判成已引用 —— 这正是上一版脚本的假阳性来源。
 * 允许前导字符：引号 / 反引号 / 斜杠 / 括号 / 空白
 * 允许后续字符：引号 / 反引号 / 右括号 / 问号 / 井号 / 空白 / 行尾
 */
function findHits(needle) {
  const esc = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(?:^|[\\s"'\`(/])${esc}(?=[\\s"'\`)?#]|$)`, 'g');
  const hits = [];
  for (const l of lines) {
    re.lastIndex = 0;
    if (re.test(l.line)) hits.push(l);
  }
  return hits;
}

const assets = walk(PUBLIC, () => true);

const used = [];
const weak = [];
const unused = [];

for (const abs of assets) {
  const rel = relative(PUBLIC, abs).split('\\').join('/');
  const base = basename(rel);
  const size = statSync(abs).size;
  const noExt = rel.replace(/\.[^.]+$/, '');

  let hits = findHits(rel);
  if (hits.length === 0) hits = findHits(noExt);
  if (hits.length > 0) {
    used.push({ rel, size, hits });
    continue;
  }
  const baseHits = findHits(base);
  if (baseHits.length > 0) {
    weak.push({ rel, size, hits: baseHits });
    continue;
  }
  unused.push({ rel, size });
}

const kb = (n) => (n / 1024).toFixed(1) + 'KB';
const sum = (arr) => arr.reduce((a, b) => a + b.size, 0);

console.log(`扫描源文件 ${srcFiles.length} 个（已剥注释），public 资源 ${assets.length} 个\n`);

const show = (title, arr) => {
  console.log(`=== ${title}  (${arr.length} 个, ${kb(sum(arr))}) ===`);
  for (const a of arr.sort((x, y) => y.size - x.size)) {
    console.log(`  ${kb(a.size).padStart(9)}  ${a.rel}`);
    for (const h of (a.hits || []).slice(0, 3)) {
      const snippet = h.line.trim().slice(0, 100);
      console.log(`             ↳ ${h.file}:${h.no}  ${snippet}`);
    }
  }
  console.log('');
};

show('UNUSED  完全未引用', unused);
show('WEAK  仅 basename 命中', weak);
show('USED  已引用', used);

console.log(
  `合计：USED ${kb(sum(used))} / WEAK ${kb(sum(weak))} / UNUSED ${kb(sum(unused))}`
);
