/**
 * 图片压缩 —— 按「显示尺寸」定尺寸，按「人眼阈值」定质量。
 *
 * 不是拍一个统一质量值，而是对每张图从低质量往上试，取**刚好达到画质阈值**的那一档：
 *   T1 ≤90px   34 dB    小图标，看的是轮廓和颜色块
 *   T2 ≤200px  36 dB
 *   T3 ≤420px  37 dB    分界线：低于 36 dB 时静态截图能看出噪点
 *   T4 ≤900px  38 dB    大图更该保真
 *
 * 尺寸规则（2 倍图）：
 *   contain / fill → 等比缩到 2×显示尺寸，整图都在画面里，不能裁
 *   cover          → 两维都必须够，只缩不裁（裁掉的虽是看不见的部分，但壳宽会变，留余量）
 *
 * 两条硬护栏：压完不比原图小就保留原图；任何一张都没有画质数据就不动它。
 *
 * 用法：node scripts/compress-images.mjs            只出报表
 *       node scripts/compress-images.mjs --apply     备份后覆盖 public/
 */
import fs from 'fs';
import path from 'path';
import { sharp, ROOT } from './_sharp.mjs';

process.chdir(ROOT);

const APPLY = process.argv.includes('--apply');
const CAND = 'outputs/img-scan/cand';
const BACKUP = '.backup/images-20261104';
const DPR = 2;
const HEADROOM = 1.06;

/* ── 读实测的显示尺寸 / object-fit ───────────────────────────────── */
const FITS = (() => {
  const txt = fs.readFileSync('outputs/img-scan/fit.txt', 'utf8');
  const map = new Map();
  for (const line of txt.split('\n')) {
    if (!line.trim()) continue;
    const m = line.match(/(\d+)x(\d+)\s+\|\s+(.+?)\s+\|\s+(\/\S+)$/);
    if (!m) continue;
    const fit = /cover/.test(m[3]) ? 'cover' : /fill/.test(m[3]) ? 'fill' : 'contain';
    map.set(m[4], { w: +m[1], h: +m[2], fit });
  }
  return map;
})();

const GUESS = [
  [/^\/dishes\/large\//, { w: 194, h: 194, fit: 'contain' }],
  [/^\/dishes\/standard\//, { w: 185, h: 185, fit: 'contain' }],
  [/^\/dishes\/cutout\//, { w: 179, h: 179, fit: 'contain' }],
  [/^\/dishes\/dish-/, { w: 179, h: 179, fit: 'contain' }],
  [/^\/backdrops\//, { w: 398, h: 224, fit: 'cover' }],
  [/^\/ingredients\//, { w: 37, h: 37, fit: 'contain' }],
  [/^\/welfare-icons\//, { w: 58, h: 58, fit: 'contain' }],
  [/^\/assets\/aistudio\//, { w: 159, h: 118, fit: 'cover' }],
];

/* ── 画质阈值 ───────────────────────────────────────────────────────
   参考值：JPEG 质量 90 约 42 dB、80 约 38 dB、70 约 34 dB。
   照片类「看不出差别」的实用下限在 35 dB 左右；小图标像素本来就少，
   降采样后再压，34 dB 已足够。阈值定太高会让体积下不来（原图本身
   已经是 80~85 质量导出的，压到同样 38 dB 必然更大）。 */
const targetPsnr = (w) => (w <= 90 ? 32.5 : w <= 200 ? 34 : w <= 420 ? 35 : 35.5);

/* 把 alpha 合成到白底，再取 RGB，避免透明区的杂色干扰对比 */
const flat = async (buf) => {
  const img = sharp(buf);
  const m = await img.metadata();
  if (m.hasAlpha) {
    return img.flatten({ background: '#ffffff' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  }
  return img.removeAlpha().raw().toBuffer({ resolveWithObject: true });
};

const psnr = (a, b, n) => {
  let se = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const d = a[i] - b[i];
    se += d * d;
  }
  const mse = se / len;
  return mse === 0 ? 99 : 10 * Math.log10((255 * 255) / mse);
};

/* ── 收集文件 ─────────────────────────────────────────────────────── */
const files = [];
const walk = (d) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(png|jpe?g)$/i.test(e.name)) files.push(p);
  }
};
walk('public');
fs.mkdirSync(CAND, { recursive: true });

const rows = [];

for (const f of files) {
  const rel = path.relative('public', f).replace(/\\/g, '/');
  const url = '/' + rel;
  const meta = await sharp(f).metadata();
  const srcKB = fs.statSync(f).size / 1024;
  const disp = FITS.get(url) || (GUESS.find(([re]) => re.test(url)) || [])[1] || null;
  const isJpeg = /\.jpe?g$/i.test(f);
  const alpha = !!meta.hasAlpha && !isJpeg;

  /* ① 定目标尺寸 */
  let tw = meta.width;
  let th = meta.height;
  if (disp) {
    const nw = disp.w * DPR * HEADROOM;
    const nh = disp.h * DPR * HEADROOM;
    const s =
      disp.fit === 'cover'
        ? Math.max(nw / meta.width, nh / meta.height)
        : Math.min(nw / meta.width, nh / meta.height);
    if (s < 0.97) {
      tw = Math.max(2, Math.round(meta.width * s));
      th = Math.max(2, Math.round(meta.height * s));
    }
  }
  const resized = tw !== meta.width || th !== meta.height;
  const pipe = () =>
    resized ? sharp(f).resize({ width: tw, height: th, fit: 'fill', kernel: 'lanczos3' }) : sharp(f);

  /* ② 参照图：原图缩到同一尺寸（分离「降采样的损失」与「编码的损失」） */
  const ref = await flat(await pipe().toBuffer());

  /* ③ 逐步降质量，找刚过线的那一档 */
  const thr = targetPsnr(Math.min(tw, th));
  const encode = async (q) => {
    const b = alpha
      ? await pipe().png({ compressionLevel: 9, palette: true, quality: q, effort: 8, dither: 1 }).toBuffer()
      : await pipe().jpeg({ quality: q, mozjpeg: true, chromaSubsampling: '4:2:0' }).toBuffer();
    return b;
  };

  const tried = [];
  const cands = [];
  for (const q of [20, 25, 30, 34, 38, 42, 46, 52, 58, 62, 66, 70, 74, 78, 82, 86]) {
    const buf = await encode(q);
    const dec = await flat(buf);
    const p = psnr(ref.data, dec.data);
    tried.push(`${q}:${(buf.length / 1024).toFixed(0)}K/${p.toFixed(1)}`);
    cands.push({ q, buf, psnr: p });
    if (p >= thr) break; // 刚好过线就停 —— 再往下压就看得出来了
  }
  // 取「达到阈值的最低质量」；一个都不达标就用最后一档（最高）
  const pass = cands.filter((c) => c.psnr >= thr);
  const best = pass.length ? pass[0] : cands[cands.length - 1];

  const newKB = best.buf.length / 1024;
  const keep = newKB >= srcKB * 0.97;
  const outPath = path.join(CAND, rel);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, keep ? fs.readFileSync(f) : best.buf);

  rows.push({
    rel,
    alpha,
    fit: disp ? disp.fit : '?',
    disp: disp ? `${disp.w}x${disp.h}` : '?',
    orig: `${meta.width}x${meta.height}`,
    next: `${tw}x${th}`,
    srcKB: +srcKB.toFixed(1),
    newKB: +(keep ? srcKB : newKB).toFixed(1),
    q: keep ? '-' : String(best.q),
    psnr: +best.psnr.toFixed(1),
    thr,
    mode: keep ? 'keep' : alpha ? 'png-palette' : 'jpeg',
    tried: tried.join(' '),
  });
}

rows.sort((a, b) => b.srcKB - a.srcKB);
const S = (k) => rows.reduce((s, r) => s + r[k], 0);
const saved = S('srcKB') - S('newKB');

const head = [
  `原图     ${(S('srcKB') / 1024).toFixed(2)} MB   (${rows.length} 个)`,
  `压缩后   ${(S('newKB') / 1024).toFixed(2)} MB`,
  `节省     ${(saved / 1024).toFixed(2)} MB  (${((saved / S('srcKB')) * 100).toFixed(1)}%)`,
  '',
];
const table = rows.map((r) => {
  const pct = ((1 - r.newKB / r.srcKB) * 100).toFixed(0);
  return `${r.rel.slice(0, 46).padEnd(46)} ${r.disp.padEnd(9)} ${String(r.srcKB).padStart(6)}→${String(r.newKB).padStart(6)} ${String(pct).padStart(4)}% ${r.mode.padEnd(11)} q${r.q.padEnd(3)} ${r.psnr}/${r.thr}dB ${r.orig}→${r.next}`;
});

fs.writeFileSync('outputs/img-scan/compress-report.txt', [...head, ...table].join('\n'), 'utf8');
fs.writeFileSync('outputs/img-scan/compress.json', JSON.stringify(rows, null, 1), 'utf8');

if (APPLY) {
  let n = 0;
  for (const r of rows) {
    if (r.mode === 'keep') continue;
    const dst = path.join('public', r.rel);
    const bak = path.join(BACKUP, r.rel);
    fs.mkdirSync(path.dirname(bak), { recursive: true });
    if (!fs.existsSync(bak)) fs.copyFileSync(dst, bak);
    fs.copyFileSync(path.join(CAND, r.rel), dst);
    n++;
  }
  console.log(`applied ${n} files, backup → ${BACKUP}`);
}
console.log(head.join('\n'));
