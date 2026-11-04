/** 列一下产物体积。 */
import fs from 'node:fs';

const D = 'outputs/cases';
const lines = fs
  .readdirSync(D)
  .filter((f) => f.endsWith('.png'))
  .sort()
  .map((f) => `${f}  ${Math.round(fs.statSync(`${D}/${f}`).size / 1024)} KB`);
lines.push(`--- ${lines.length} 张 ---`);
fs.writeFileSync('outputs/_sizes.txt', lines.join('\n'), 'utf8');
