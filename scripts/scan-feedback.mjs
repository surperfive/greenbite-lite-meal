/**
 * 统计「可点击但没有任何按压反馈」的元素。
 * 判据：className 里出现 cursor-pointer / rounded-full / bg-[#C7F665] 之类按钮特征，
 * 但整串里既没有 active: 也没有 group-active:。
 *
 * ⚠️ 只处理单行 className（模板字符串里带 ${} 的会把 ${} 段单独看），
 *    跨行 className 会漏——本项目的 className 基本都写在一行，够用。
 *
 * 用法：node scripts/scan-feedback.mjs
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

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

// 按钮特征：出现任意一个就认为这是「一个可点的东西」
const CLICKABLE = /cursor-pointer|rounded-full|group-hover:|onClick/;
const HAS_FEEDBACK = /active:|group-active:/;

const rows = [];
for (const f of files) {
  const lines = readFileSync(f, 'utf8').split('\n');
  lines.forEach((line, i) => {
    // 取出这一行里所有 "..." 或 `...` 形式的 className 候选串
    for (const m of line.matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`\})/g)) {
      const cls = (m[1] ?? m[2] ?? '').trim();
      if (!cls) continue;
      // 只看含 ${...} 的那一段，避免整串被判成"有 active"
      if (cls.includes('${')) {
        // 模板字符串：逐段检查 ${ 里的三元分支
        const parts = cls.split(/\$\{[^}]*\}/);
        const dyn = cls.match(/\$\{([^}]*)\}/g) || [];
        for (let k = 0; k < dyn.length; k++) {
          const seg = dyn[k];
          const before = parts[k] || '';
          if (!CLICKABLE.test(before + seg)) continue;
          if (!HAS_FEEDBACK.test(before + seg)) {
            rows.push({ file: f, line: i + 1, cls: (before + seg).slice(0, 90) });
            break;
          }
        }
        continue;
      }
      if (!CLICKABLE.test(cls)) continue;
      if (!HAS_FEEDBACK.test(cls)) rows.push({ file: f, line: i + 1, cls: cls.slice(0, 90) });
    }
  });
}

console.log(`共 ${rows.length} 处「可点但无按压反馈」\n`);
for (const r of rows) {
  console.log(`${r.file}:${r.line}`);
  console.log(`    ${r.cls}`);
}
