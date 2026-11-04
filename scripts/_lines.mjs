import fs from 'fs';
const raw = JSON.parse(fs.readFileSync('outputs/align2/raw.json', 'utf8'));
const pages = ['home', 'menu', 'gacha', 'orders', 'me'];
const lines = [];
for (const p of pages) {
  const rows = raw[p].rows;
  // 左缘聚类（±1px）
  const cl = new Map();
  for (const r of rows) {
    const k = Math.round(r.x);
    let hit = null;
    for (const kk of cl.keys()) if (Math.abs(kk - k) <= 1) hit = kk;
    const key = hit ?? k;
    if (!cl.has(key)) cl.set(key, []);
    cl.get(key).push(r);
  }
  lines.push(`===== ${p} =====`);
  [...cl.entries()]
    .sort((a, b) => a[0] - b[0])
    .forEach(([k, g]) => {
      lines.push(`  L${k}  ×${g.length}  ` + g.slice(0, 4).map((r) => `"${r.text}"`).join(' '));
    });

  // 右缘聚类
  const cr = new Map();
  for (const r of rows) {
    const k = Math.round(r.r);
    let hit = null;
    for (const kk of cr.keys()) if (Math.abs(kk - k) <= 1) hit = kk;
    const key = hit ?? k;
    if (!cr.has(key)) cr.set(key, []);
    cr.get(key).push(r);
  }
  lines.push(`  --- 右缘 ---`);
  [...cr.entries()]
    .sort((a, b) => a[0] - b[0])
    .forEach(([k, g]) => {
      if (k < 280) return;
      lines.push(`  R${k}  ×${g.length}  ` + g.slice(0, 4).map((r) => `"${r.text}"`).join(' '));
    });
}
fs.writeFileSync('outputs/align2/lines.txt', lines.join('\n'), 'utf8');
console.log('ok');
