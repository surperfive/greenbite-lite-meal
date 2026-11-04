/**
 * 把 10 处逐字复制的「圆形勾选徽章」换成共享组件 <CheckBadge>。
 *
 * 匹配的既有写法（差异只在：容器是 span 还是 div、定位类名、选中表达式、
 * shrink-0 有无、未选小圆点是 span 还是 div、灰阶 200/300、svg 属性是否折行）：
 *
 *   <span|div
 *     className={`<定位类名> w-3.5 h-3.5 rounded-full border-[1.2px] border-black
 *                 flex items-center justify-center [shrink-0 ]transition-all ${
 *       <expr> ? 'bg-[#C7F665]' : 'bg-white'
 *     }`}
 *   >
 *     {<expr> ? ( <svg ...><polyline points="20 6 9 17 4 12" /></svg> )
 *      : ( <span|div className="w-0.5 h-0.5 rounded-full bg-slate-200|300" /> )}
 *   </span|div>
 *
 * 用法：node scripts/refactor-checkbadge.mjs [--write]
 */
import { readFileSync, writeFileSync } from 'node:fs';

const FILES = ['src/components/ProductDetailPage.tsx', 'src/components/GachaPage.tsx'];
const WRITE = process.argv.includes('--write');

// ① 容器开始：<(span|div) + className 模板串（含定位类名与选中表达式）
const OPEN_RE =
  /<(span|div)\s+className=\{`([^`]*?)w-3\.5 h-3\.5 rounded-full border-\[1\.2px\] border-black flex items-center justify-center (?:shrink-0 )?transition-all \$\{\s*([^?]+?)\s*\?\s*'bg-\[#C7F665\]'\s*:\s*'bg-white'\s*\}`\}\s*>\s*\{\s*\3\s*\?\s*\(/;

// ② 选中分支的 svg（属性可折行）
const SVG_RE =
  /<svg\s+className="w-2 h-2 text-black"\s+viewBox="0 0 24 24"[\s\S]*?>\s*<polyline points="20 6 9 17 4 12" \/>\s*<\/svg>/;

// ③ 未选中小圆点
const DOT_RE = /<(?:span|div) className="w-0\.5 h-0\.5 rounded-full bg-slate-[23]00" \/>/;

// ④ 三元收尾 + 外层容器闭合
const CLOSE_RE = /\s*\)\s*\}\s*<\/(?:span|div)>/;

let done = 0;
const log = [];

for (const f of FILES) {
  let src = readFileSync(f, 'utf8');
  let n = 0;

  for (let guard = 0; guard < 50; guard++) {
    const open = src.match(OPEN_RE);
    if (!open) break;
    const openStart = open.index;
    const position = open[2].trim();
    const expr = open[3].trim();
    let p = openStart + open[0].length;

    // svg
    const rest1 = src.slice(p);
    const svg = rest1.match(SVG_RE);
    if (!svg) { log.push(`${f}:@${openStart} 容器后不是标准 svg，跳过`); break; }
    p += svg.index + svg[0].length;

    // `) : (`
    const rest2 = src.slice(p);
    const mid = rest2.match(/^\s*\)\s*:\s*\(\s*/);
    if (!mid) { log.push(`${f}:@${openStart} svg 后不是 ") : ("，跳过`); break; }
    p += mid[0].length;

    // 小圆点
    const rest3 = src.slice(p);
    const dot = rest3.match(DOT_RE);
    if (!dot) { log.push(`${f}:@${openStart} 找不到未选小圆点，跳过`); break; }
    if (dot.index !== 0) { log.push(`${f}:@${openStart} 小圆点前有多余内容，跳过`); break; }
    p += dot[0].length;

    // 收尾 `)} </span|div>`
    const rest4 = src.slice(p);
    const close = rest4.match(CLOSE_RE);
    if (!close) { log.push(`${f}:@${openStart} 找不到容器闭合，跳过`); break; }
    p += close[0].length;

    src = src.slice(0, openStart) + `<CheckBadge selected={${expr}} className="${position}" />` + src.slice(p);
    n++;
  }

  if (n) {
    log.push(`${f}: 替换 ${n} 处`);
    done += n;
    if (WRITE) writeFileSync(f, src);
  }
}

console.log(log.join('\n'));
console.log(`\n共 ${done} 处${WRITE ? '（已写入）' : '（试运行，加 --write 才落盘）'}`);
