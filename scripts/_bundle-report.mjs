/**
 * 分析打包产物的体积构成：按 node_modules 包 / 项目源码分组统计。
 *
 * 用 sourcemap 的 sourcesContent 长度做近似（原始代码体积），
 * 足以回答「谁把包撑大了」，不用装可视化插件。
 *
 * 用法：node scripts/_bundle-report.mjs
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const dir = 'dist/assets';
const mapFile = readdirSync(dir).find((f) => f.endsWith('.js.map'));
if (!mapFile) {
  console.error('没找到 .js.map，请先跑 npx vite build --sourcemap');
  process.exit(1);
}

const map = JSON.parse(readFileSync(join(dir, mapFile), 'utf8'));
const byPkg = new Map();

map.sources.forEach((src, i) => {
  const content = map.sourcesContent?.[i] ?? '';
  const size = Buffer.byteLength(content, 'utf8');
  const m = src.match(/node_modules\/((?:@[^/]+\/)?[^/]+)/);
  let key;
  if (m) key = m[1];
  else if (src.includes('/src/') || src.startsWith('src/')) key = '【项目源码】';
  else key = '【其它】' + src.split('/').slice(-2).join('/');
  byPkg.set(key, (byPkg.get(key) ?? 0) + size);
});

const total = [...byPkg.values()].reduce((a, b) => a + b, 0);
const rows = [...byPkg.entries()].sort((a, b) => b[1] - a[1]);

console.log(`产物 ${mapFile}  源文件 ${map.sources.length} 个  原始体积合计 ${(total / 1024).toFixed(0)} KB\n`);
console.log('  占比    体积        包 / 分组');
console.log('-'.repeat(64));
for (const [k, v] of rows.slice(0, 20)) {
  const pct = ((v / total) * 100).toFixed(1);
  const bar = '█'.repeat(Math.round((v / rows[0][1]) * 24));
  console.log(`${pct.padStart(5)}%  ${(v / 1024).toFixed(0).padStart(6)} KB  ${k.padEnd(24)} ${bar}`);
}
console.log('-'.repeat(64));

// 项目源码里最大的单文件
const srcRows = map.sources
  .map((s, i) => ({ s, n: Buffer.byteLength(map.sourcesContent?.[i] ?? '', 'utf8') }))
  .filter((r) => r.s.includes('/src/') && !r.s.includes('node_modules'))
  .sort((a, b) => b.n - a.n);
console.log('\n项目源码最大的 10 个文件：');
for (const r of srcRows.slice(0, 10)) {
  console.log(`  ${(r.n / 1024).toFixed(1).padStart(6)} KB  ${r.s.split('/src/').pop()}`);
}
