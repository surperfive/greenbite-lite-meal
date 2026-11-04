/** 从 scan.json 提炼：每页的轨道 + 仍越界的元素（只留 Δ 超 1.5 的）。 */
import fs from 'node:fs';

const data = JSON.parse(fs.readFileSync('outputs/align/scan.json', 'utf8'));
const lines = [];

for (const p of data) {
  const t = p.track;
  lines.push(`===== ${p.page} =====  轨道 ${t ? `L${t.left}/R${t.right}` : '?'}  · 偏差数 ${p.count}`);
  // 只列真正越界的：ΔL < -1.5（左溢出）或 ΔR > 1.5（右溢出）
  const bad = p.items.filter((i) => i.dL < -1.5 || i.dR > 1.5);
  for (const i of bad.slice(0, 8)) {
    lines.push(`  ⚠ L${i.left}/R${i.right} (ΔL${i.dL} ΔR${i.dR}) <${i.tag}> "${i.txt}"`);
  }
  if (!bad.length) lines.push('  （无越界）');
}

fs.writeFileSync('outputs/align/after.txt', lines.join('\n'), 'utf8');
