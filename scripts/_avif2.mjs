import fs from 'fs';
import { sharp } from './_sharp.mjs';

const cases = [
  'hero-poster-tuna.jpg',
  'hero-poster-latte.jpg',
  'backdrops/teriyaki-pot.jpg',
  'dishes/large/dish-tuna-sandwich.png',
  'dishes/dish-greek-yogurt.jpg',
];

const flat = async (buf) => {
  const img = sharp(buf);
  const m = await img.metadata();
  if (m.hasAlpha) return img.flatten({ background: '#fff' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return img.removeAlpha().raw().toBuffer({ resolveWithObject: true });
};
const psnr = (a, b) => {
  let se = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    const d = a[i] - b[i];
    se += d * d;
  }
  const mse = se / n;
  return mse === 0 ? 99 : 10 * Math.log10((255 * 255) / mse);
};

const lines = ['文件'.padEnd(34) + '现有(压缩后)'.padStart(16) + '   AVIF q50'.padStart(18) + '   AVIF q60'.padStart(18) + '   WebP q75'.padStart(18)];
for (const rel of cases) {
  const cur = 'public/' + rel;
  const orig = '.backup/images-20261104/' + rel;
  const m = await sharp(cur).metadata();
  // 参照：原图（备份）裁/缩到与当前同尺寸
  const ref = await flat(await sharp(orig).resize(m.width, m.height, { fit: 'cover', position: 'centre', kernel: 'lanczos3' }).toBuffer());
  const mk = async (buf) => {
    const d = await flat(buf);
    return { kb: (buf.length / 1024).toFixed(1), p: psnr(ref.data, d.data).toFixed(1) };
  };
  const a = await mk(fs.readFileSync(cur));
  const b = await mk(await sharp(cur).avif({ quality: 50, effort: 4 }).toBuffer());
  const c = await mk(await sharp(cur).avif({ quality: 60, effort: 4 }).toBuffer());
  const d = await mk(await sharp(cur).webp({ quality: 75, effort: 6 }).toBuffer());
  lines.push(
    rel.slice(0, 34).padEnd(34) +
      `${a.kb}KB/${a.p}dB`.padStart(16) +
      `${b.kb}KB/${b.p}dB`.padStart(18) +
      `${c.kb}KB/${c.p}dB`.padStart(18) +
      `${d.kb}KB/${d.p}dB`.padStart(18)
  );
}
fs.writeFileSync('outputs/img-scan/avif-quality.txt', lines.join('\n'), 'utf8');
console.log(lines.join('\n'));
