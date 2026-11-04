/** 提取 audit.json 明细，按「前景 on 背景」聚类，区分已登记取舍与新漏。 */
import fs from 'node:fs';

const raw = JSON.parse(fs.readFileSync('outputs/audit/audit.json', 'utf8'));
const pages = raw.pages || {};
const lines = [];
const push = (s) => lines.push(s);

const total = { contrast: 0, small: 0, smallHard: 0 };
for (const [name, page] of Object.entries(pages)) {
  const c = page.contrast || [];
  const st = (page.smallTargets || []).filter((x) => !x.pass);
  total.contrast += c.length;
  total.small += st.length;
  total.smallHard += st.filter((x) => x.hitW < 24 || x.hitH < 24).length;

  push(`\n===== ${name} =====  contrast ${c.length} · 命中区不足 ${st.length}`);

  const groups = new Map();
  for (const it of c) {
    const key = `${it.color} on ${it.bg} @${it.fs}px r=${it.ratio}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(it);
  }
  for (const [k, arr] of [...groups.entries()].sort((a, b) => b[1].length - a[1].length)) {
    push(`  [${k}] ×${arr.length}`);
    for (const it of arr.slice(0, 3)) push(`      "${(it.text || '').slice(0, 18)}"  ${it.el.slice(0, 70)}`);
  }

  push('  --- 命中区 ---');
  for (const it of st) {
    push(`    ${it.w}x${it.h} → ${it.hitW}x${it.hitH}  "${(it.text || '').slice(0, 16)}"  ${it.el.slice(0, 60)}`);
  }
}

push(`\n\nTOTAL contrast=${total.contrast} smallTargets=${total.small} hardFail(<24)=${total.smallHard}`);
fs.writeFileSync('outputs/_audit-digest.txt', lines.join('\n'), 'utf8');
