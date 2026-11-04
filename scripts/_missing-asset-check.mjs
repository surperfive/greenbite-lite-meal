/**
 * 反向校验：src/ 里引用的每一个 /xxx 静态资源，public/ 下是否真的存在。
 *
 * 这是清理死文件之后的守门员 —— 正向扫描（_asset-usage-scan）只回答
 * 「文件有没有被用」，不回答「用了的文件还在不在」。
 *
 * 用法：node scripts/_missing-asset-check.mjs
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOT = process.cwd();
const PUBLIC = join(ROOT, 'public');

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

/**
 * 剥掉注释再查引用。
 * 不剥的话会把 `{/* ... *\/}` 里「留作回退」的旧写法当成真引用，
 * 报出一堆假断链（HomePage 的 /mascot_invite.png 就是这种）。
 */
function stripComments(text) {
  return text
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')  // JSX 注释 {/* ... */}
    .replace(/\/\*[\s\S]*?\*\//g, '')      // 块注释
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1'); // 行注释（避开 https://）
}

const srcFiles = walk(join(ROOT, 'src'), (p) =>
  ['.ts', '.tsx', '.css', '.js', '.jsx'].includes(extname(p))
);
srcFiles.push(join(ROOT, 'index.html'));

// 匹配 '/xxx.ext' 形式，扩展名限定为静态资源
const ASSET_RE = /['"`](\/[A-Za-z0-9_\-./]+\.(?:png|jpe?g|webp|svg|gif|mp4|webm|json|woff2?|ttf))['"`]/g;

const missing = [];
const found = new Set();

for (const f of srcFiles) {
  const txt = stripComments(readFileSync(f, 'utf8'));
  let m;
  ASSET_RE.lastIndex = 0;
  while ((m = ASSET_RE.exec(txt))) {
    const url = m[1];
    found.add(url);
    const abs = join(PUBLIC, url.slice(1));
    if (!existsSync(abs)) {
      const lineNo = txt.slice(0, m.index).split('\n').length;
      missing.push({ url, file: f.replace(ROOT, '').replace(/\\/g, '/').replace(/^\//, ''), line: lineNo });
    }
  }
}

console.log(`src 引用到的静态资源 ${found.size} 个`);

if (missing.length === 0) {
  console.log('✓ 全部存在，没有断链');
} else {
  console.log(`\n✗ 有 ${missing.length} 处引用指向不存在的文件：`);
  for (const m of missing) console.log(`  ${m.url}\n      ↳ ${m.file}:${m.line}`);
  process.exitCode = 1;
}
