import fs from 'fs';
import path from 'path';

const chars = new Set();
let bytes = 0;
const walk = (d) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(tsx|ts)$/.test(e.name)) {
      const s = fs.readFileSync(p, 'utf8');
      bytes += s.length;
      for (const ch of s) {
        const c = ch.codePointAt(0);
        if (c > 0x2e80) chars.add(ch);
      }
    }
  }
};
walk('src');

const arr = [...chars];
const cjk = arr.filter((c) => {
  const p = c.codePointAt(0);
  return (p >= 0x4e00 && p <= 0x9fff) || (p >= 0x3400 && p <= 0x4dbf);
});

fs.writeFileSync(
  'outputs/img-scan/charset.txt',
  [
    `源码总字符数 ${bytes}`,
    `唯一非 ASCII 字符 ${arr.length}（其中汉字 ${cjk.length}）`,
    `字符集：${arr.join('')}`,
  ].join('\n'),
  'utf8'
);
console.log(arr.length, cjk.length);
