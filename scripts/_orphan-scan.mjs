/**
 * 扫描 src/ 下的「孤儿源文件」：没有任何其它文件 import 它。
 *
 * 只报告，不删除。入口文件（main.tsx / App.tsx）视为根，跳过。
 * 注意：动态 import（import(...)）也算引用，会被正则捕获。
 *
 * 用法：node scripts/_orphan-scan.mjs
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, basename, extname } from 'node:path';

const ROOT = process.cwd();
const SRC = join(ROOT, 'src');

const ROOTS = new Set(['src/main.tsx', 'src/App.tsx']);

function walk(dir, filter) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...walk(p, filter));
    else if (filter(p)) out.push(p);
  }
  return out;
}

const files = walk(SRC, (p) => ['.ts', '.tsx'].includes(extname(p)));

// 读取所有文件内容，用于统计「谁被 import 了」
const contents = new Map();
for (const f of files) contents.set(f, readFileSync(f, 'utf8'));

const relOf = (p) => relative(ROOT, p).split('\\').join('/');

/** 某个文件被引用的次数（按 basename 或相对路径匹配 import 语句） */
function refCount(target) {
  const base = basename(target).replace(/\.(tsx?|css)$/, '');
  const relNoExt = relOf(target).replace(/\.(tsx?|css)$/, '');
  let n = 0;
  const importers = [];
  for (const [f, txt] of contents) {
    if (f === target) continue;
    const re = new RegExp(
      `(?:from\\s*['"]|import\\s*\\(\\s*['"]|require\\(\\s*['"])([^'"]+)['"]`,
      'g'
    );
    let m;
    while ((m = re.exec(txt))) {
      const spec = m[1];
      if (spec.endsWith('/' + base) || spec === './' + base || spec.endsWith(relNoExt) || spec === base) {
        n++;
        importers.push(relOf(f));
        break;
      }
    }
  }
  return { n, importers };
}

const orphans = [];
for (const f of files) {
  const rel = relOf(f);
  if (ROOTS.has(rel)) continue;
  const { n, importers } = refCount(f);
  if (n === 0) orphans.push({ rel, size: statSync(f).size, importers });
}

console.log(`src 下共 ${files.length} 个 ts/tsx 文件，扫描完成\n`);
console.log(`=== 孤儿文件（无人 import，共 ${orphans.length} 个）===`);
for (const o of orphans.sort((a, b) => b.size - a.size)) {
  console.log(`  ${(o.size / 1024).toFixed(1).padStart(7)}KB  ${o.rel}`);
}
