/** 检查抓帧的实际像素尺寸（是否真的 3 倍）。 */
import fs from 'node:fs';
import path from 'node:path';

const RAW = 'outputs/motion-hover-raw';

/** 读 JPEG 的 SOF 段拿宽高 */
const jpegSize = (file) => {
  const b = fs.readFileSync(file);
  let i = 2;
  while (i < b.length) {
    if (b[i] !== 0xff) { i++; continue; }
    const m = b[i + 1];
    if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
      return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
    }
    i += 2 + b.readUInt16BE(i + 2);
  }
  return null;
};

const lines = [];
for (const d of fs.readdirSync(RAW)) {
  const dir = path.join(RAW, d);
  if (!fs.statSync(dir).isDirectory()) continue;
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.jpg')).sort();
  if (!files.length) { lines.push(`${d}: 无帧`); continue; }
  const sizes = new Set();
  for (const f of [files[0], files[Math.floor(files.length / 2)], files[files.length - 1]]) {
    const s = jpegSize(path.join(dir, f));
    if (s) sizes.add(`${s.w}x${s.h}`);
  }
  lines.push(`${d}: ${files.length} 帧 · 抽样尺寸 ${[...sizes].join(' / ')}`);
}
fs.writeFileSync('outputs/_framesize.txt', lines.join('\n'), 'utf8');
