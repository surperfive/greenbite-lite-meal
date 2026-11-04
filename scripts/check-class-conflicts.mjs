/**
 * 检查 className 里**尺寸/布局类**属性的重复（后者覆盖前者）。
 * 只看可能被 strip-sm.mjs 弄坏的类型：宽高、内距、间距、字号、圆角。
 * 颜色/字重/边框粗细**故意不查** —— 那类 last-wins 是正常写法，查了全是噪音。
 *
 * 用法：node scripts/check-class-conflicts.mjs
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const VARIANT = /^(?:sm|md|lg|xl|2xl|hover|active|focus|group-hover|group-active|focus-visible|disabled|first|last|dark|focus-within):/;

/** 归一化到「同一属性」的 key；返回 null 表示这一类不用查 */
const keyOf = (t) => {
  const b = t.replace(VARIANT, '');
  const m = b.match(/^([a-z]+(?:-[a-z]+)?)-/);
  if (!m) return null;
  const p = m[1];
  // 只关心这些
  if (['w', 'h', 'min-w', 'min-h', 'max-w', 'max-h', 'p', 'px', 'py', 'pt', 'pb', 'pl', 'pr',
       'gap', 'gap-x', 'gap-y', 'text', 'rounded', 'size', 'leading', 'tracking'].includes(p)) {
    if (p === 'text') {
      // text- 只有「字号」才查；颜色/对齐不查
      const v = b.slice(5);
      if (/^\[[0-9.]+(px|rem|em)\]$/.test(v)) return 'text-size';
      if (/^(xs|sm|base|lg|xl|[2-9]xl)$/.test(v)) return 'text-size';
      return null;
    }
    if (p === 'rounded') return 'rounded';
    return p;
  }
  return null;
};

let bad = 0;
let tot = 0;
const walk = (d) => {
  for (const e of readdirSync(d, { withFileTypes: true })) {
    const p = join(d, e.name);
    if (e.isDirectory()) { walk(p); continue; }
    if (!/\.tsx?$/.test(e.name)) continue;
    readFileSync(p, 'utf8').split('\n').forEach((line, i) => {
      for (const m of line.matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`\})/g)) {
        const cls = (m[1] ?? m[2] ?? '').trim();
        if (!cls) continue;
        tot++;
        const seen = new Map();
        for (const t of cls.split(/\s+/)) {
          if (!t || t.includes('${')) continue;
          const k = keyOf(t);
          if (!k) continue;
          if (VARIANT.test(t)) continue;              // 变体之间可以重复
          if (seen.has(k)) {
            bad++;
            console.log(`${p}:${i + 1}  [${k}]  ${seen.get(k)}  vs  ${t}`);
          } else seen.set(k, t);
        }
      }
    });
  }
};
walk('src');
console.log(`\n扫描 ${tot} 个 className，尺寸/布局类重复 ${bad} 处`);
