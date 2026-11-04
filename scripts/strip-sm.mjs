/**
 * 去掉手机壳内不该有的 `sm:` 前缀（铁律见 MEMORY.md）。
 *
 * 背景：整个应用渲染在恒为 410px 的手机壳里，`sm:` 看的是**视口**宽度，
 * 于是同一份代码在桌面浏览器（≥640px，sm: 生效）和窄窗口（<640px，sm: 失效）
 * 会渲染成两种样子。桌面端是用户一直在看的样子，所以**保留 sm: 那一侧的取值**。
 *
 * 规则：`A sm:B`（A、B 同类属性）→ `B`；没有同类基础值的 `sm:X` → 去前缀。
 *
 * ⚠️ 关键实现约束：**只处理 className 模板字符串里的字面段**，
 *    `${...}` 表达式（含里面的字符串、引号、三元、换行）原样保留。
 *    第一版没做这件事，把 `${ isScrolled ? 'h-[145px] sm:h-[155px]' : ... }`
 *    按空格切开重组，产出了 `'h-[145px] h-[155px]'` 这种两个值挤在一个分支里
 *    的坏代码。表达式内部的 sm: 靠人工改（全项目只有 1 处）。
 *
 * 用法：node scripts/strip-sm.mjs [--write]
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const WRITE = process.argv.includes('--write');
const ROOT = 'src';

const files = [];
const walk = (d) => {
  for (const e of readdirSync(d, { withFileTypes: true })) {
    const p = join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.tsx?$/.test(e.name)) files.push(p);
  }
};
walk(ROOT);

const VARIANT = /^(?:sm|md|lg|xl|2xl|hover|active|focus|group-hover|group-active|focus-visible|disabled|first|last|dark|focus-within):/;

/** 取属性的"前缀"，用于判断两个 token 是否描述同一个属性 */
const propOf = (t) => {
  const bare = t.replace(VARIANT, '');
  const m = bare.match(/^[a-z]+-/);
  return m ? m[0] : '';
};

/**
 * 处理一段**字面** class 串（里面不含 ${}）。
 * 返回 { text, pairs, solo }
 */
const processLiteral = (seg) => {
  const lead = seg.match(/^\s*/)[0];
  const trail = seg.match(/\s*$/)[0];
  const tokens = seg.trim().split(/\s+/).filter(Boolean);
  const drop = new Set();
  let pairs = 0;
  let solo = 0;

  for (let i = 0; i < tokens.length; i++) {
    if (!tokens[i].startsWith('sm:')) continue;
    const p = propOf(tokens[i]);
    let matched = false;
    if (p) {
      // ⚠️ 只在**同一段字面**里往前找同类基础 token。
      //    不能只看前一格 —— `w-20 h-20 sm:w-22 sm:h-22` 里 sm:w-22 的前一格是 h-20。
      for (let j = i - 1; j >= 0; j--) {
        if (tokens[j].startsWith('sm:')) continue;
        if (VARIANT.test(tokens[j])) continue;
        if (propOf(tokens[j]) === p) { drop.add(j); matched = true; pairs++; break; }
      }
    }
    if (!matched) solo++;
  }

  const keep = [];
  for (let i = 0; i < tokens.length; i++) {
    if (drop.has(i)) continue;
    keep.push(tokens[i].replace(/^sm:/, ''));
  }
  return { text: lead + keep.join(' ') + trail, pairs, solo };
};

let totalPairs = 0;
let totalSolo = 0;
const report = [];

for (const f of files) {
  const src = readFileSync(f, 'utf8');
  let changed = 0;

  const out = src.replace(/className=(?:"([^"]*)"|\{`([^`]*)`\})/g, (whole, dq, tpl) => {
    // ① 普通双引号串：整体就是字面段
    if (dq !== undefined) {
      if (!dq.includes('sm:')) return whole;
      const r = processLiteral(dq);
      totalPairs += r.pairs; totalSolo += r.solo; changed++;
      return `className="${r.text}"`;
    }
    // ② 模板字符串：按 ${...} 切段，只改字面段，表达式原样拼回
    if (!tpl.includes('sm:')) return whole;
    const segs = tpl.split(/(\$\{[^}]*\})/);
    for (let i = 0; i < segs.length; i += 2) {
      if (!segs[i].includes('sm:')) continue;
      const r = processLiteral(segs[i]);
      totalPairs += r.pairs; totalSolo += r.solo;
      segs[i] = r.text;
      changed++;
    }
    return `className={\`${segs.join('')}\`}`;
  });

  if (changed) {
    report.push(`${f}: ${changed} 处`);
    if (WRITE) writeFileSync(f, out);
  }
}

console.log(report.join('\n'));
console.log(`\n成对收敛 ${totalPairs} 处，去前缀 ${totalSolo} 处${WRITE ? '（已写入）' : '（试运行，加 --write 才落盘）'}`);
