import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const rows = [];
const walk = (d) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else rows.push(p);
  }
};
walk('dist/assets');

const kb = (n) => (n / 1024).toFixed(1);
const lines = ['资源'.padEnd(28) + '原始'.padStart(9) + 'gzip'.padStart(9) + 'brotli'.padStart(9)];
let t = [0, 0, 0];
for (const f of rows.sort((a, b) => fs.statSync(b).size - fs.statSync(a).size)) {
  const b = fs.readFileSync(f);
  const g = zlib.gzipSync(b, { level: 9 }).length;
  const br = zlib.brotliCompressSync(b, {
    params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 },
  }).length;
  t = [t[0] + b.length, t[1] + g, t[2] + br];
  lines.push(
    path.basename(f).padEnd(28) +
      (kb(b.length) + ' KB').padStart(9) +
      (kb(g) + ' KB').padStart(9) +
      (kb(br) + ' KB').padStart(9)
  );
}
lines.push('—'.repeat(55));
lines.push('合计'.padEnd(28) + (kb(t[0]) + ' KB').padStart(9) + (kb(t[1]) + ' KB').padStart(9) + (kb(t[2]) + ' KB').padStart(9));
fs.writeFileSync('outputs/img-scan/bundle.txt', lines.join('\n'), 'utf8');
console.log(lines.join('\n'));
