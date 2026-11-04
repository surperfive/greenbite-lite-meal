/**
 * 项目「无用文件」扫描（只读，不删任何东西）。
 *
 * 三类检查：
 *   A. 素材引用：每个图片/视频的 basename 是否被 src / index.html / vite.config 引用
 *   B. 组件引用：每个 src 下的模块是否被其它文件 import
 *   C. 目录占用 + 内容重复（同哈希）
 *
 * 用法：node scripts/scan-unused.mjs
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative, extname, basename } from 'node:path';
import { createHash } from 'node:crypto';

const ROOT = process.cwd();
const SKIP_DIRS = new Set(['node_modules', '.git', '.vite', 'dist']);

// ── 收集文件 ────────────────────────────────────────────────
const allFiles = [];
const walk = (dir) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name)) continue;
      walk(join(dir, e.name));
    } else {
      const p = join(dir, e.name);
      allFiles.push({ p, rel: relative(ROOT, p).replace(/\\/g, '/'), size: statSync(p).size });
    }
  }
};
walk(ROOT);

// ── 源码全文（用于引用检索）────────────────────────────────
const SRC_EXT = new Set(['.ts', '.tsx', '.css', '.html', '.js', '.mjs', '.json']);
const codeFiles = allFiles.filter(
  (f) =>
    (f.rel.startsWith('src/') || f.rel === 'index.html' || f.rel === 'vite.config.ts') &&
    SRC_EXT.has(extname(f.rel))
);
const codeText = codeFiles.map((f) => readFileSync(f.p, 'utf8')).join('\n');

// ── A. 素材引用 ─────────────────────────────────────────────
const ASSET_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.svg', '.mp4', '.gif', '.ico']);
const assets = allFiles.filter((f) => ASSET_EXT.has(extname(f.rel).toLowerCase()));

const referenced = [];
const unreferenced = [];
for (const a of assets) {
  const name = basename(a.rel);
  // 引用可能写成 /name、./name、name，统一按 basename 命中
  if (codeText.includes(name)) referenced.push(a);
  else unreferenced.push(a);
}

// ── B. 模块引用 ─────────────────────────────────────────────
const modules = allFiles.filter(
  (f) => f.rel.startsWith('src/') && ['.ts', '.tsx'].includes(extname(f.rel))
);
const unusedModules = [];
for (const m of modules) {
  const base = basename(m.rel).replace(/\.(ts|tsx)$/, '');
  // 统计「除自己以外」有多少文件 import 了它
  let hits = 0;
  for (const f of codeFiles) {
    if (f.p === m.p) continue;
    const t = readFileSync(f.p, 'utf8');
    if (new RegExp(`from\\s+['"][^'"]*${base}['"]`).test(t)) hits++;
  }
  if (hits === 0) unusedModules.push(m);
}

// ── C. 重复内容 ─────────────────────────────────────────────
const byHash = new Map();
for (const a of assets) {
  if (a.size < 4096) continue;
  const h = createHash('sha1').update(readFileSync(a.p)).digest('hex');
  if (!byHash.has(h)) byHash.set(h, []);
  byHash.get(h).push(a);
}
const dupGroups = [...byHash.values()].filter((g) => g.length > 1);

// ── 输出 ────────────────────────────────────────────────────
const fmt = (n) => (n > 1024 * 1024 ? `${(n / 1048576).toFixed(1)}M` : `${Math.round(n / 1024)}K`);

console.log('══════ A. 未被源码引用的素材 ══════');
let sumA = 0;
for (const f of unreferenced.sort((a, b) => b.size - a.size)) {
  sumA += f.size;
  console.log(`  ${fmt(f.size).padStart(7)}  ${f.rel}`);
}
console.log(`  合计 ${unreferenced.length} 个 / ${fmt(sumA)}\n`);

console.log('══════ B. 未被任何文件 import 的模块 ══════');
for (const f of unusedModules) console.log(`  ${fmt(f.size).padStart(7)}  ${f.rel}`);
console.log('');

console.log('══════ C. 内容完全相同的重复文件 ══════');
let sumC = 0;
for (const g of dupGroups) {
  console.log(`  [${fmt(g[0].size)} x ${g.length}]`);
  for (const f of g) console.log(`      ${f.rel}`);
  sumC += g[0].size * (g.length - 1);
}
console.log(`  可回收约 ${fmt(sumC)}\n`);

console.log('══════ D. 目录占用 ══════');
const dirs = new Map();
for (const f of allFiles) {
  const top = f.rel.includes('/') ? f.rel.split('/')[0] : '(根目录散文件)';
  dirs.set(top, (dirs.get(top) || 0) + f.size);
}
for (const [d, s] of [...dirs].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${fmt(s).padStart(8)}  ${d}`);
}
