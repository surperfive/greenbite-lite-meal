import fs from 'fs';
import { sharp } from './_sharp.mjs';

const cases = ['hero-poster-tuna.jpg', 'hero-poster-latte.jpg', 'backdrops/teriyaki-pot.jpg', 'dishes/large/dish-tuna-sandwich.png'];
const lines = [];
for (const rel of cases) {
  const f = 'public/' + rel;
  const src = fs.statSync(f).size / 1024;
  const m = await sharp(f).metadata();
  const row = [`${rel}  ${m.width}x${m.height}  现 ${src.toFixed(1)} KB`];
  for (const q of [45, 55, 65]) {
    const a = (await sharp(f).avif({ quality: q, effort: 4 }).toBuffer()).length / 1024;
    row.push(`    avif q${q}: ${a.toFixed(1)} KB  (-${((1 - a / src) * 100).toFixed(0)}%)`);
  }
  for (const q of [75, 82]) {
    const w = (await sharp(f).webp({ quality: q, effort: 6 }).toBuffer()).length / 1024;
    row.push(`    webp q${q}: ${w.toFixed(1)} KB  (-${((1 - w / src) * 100).toFixed(0)}%)`);
  }
  lines.push(row.join('\n'));
}
fs.writeFileSync('outputs/img-scan/avif-webp.txt', lines.join('\n'), 'utf8');
console.log(lines.join('\n'));
