/** 盘点 raw 帧：每个场景多少张、什么尺寸，判断哪些是 screencast 版、哪些是截图版。 */
import fs from 'node:fs';
import path from 'node:path';

const RAW = 'outputs/motion-hover-raw';
const jpegSize = (b) => {
  let i = 2;
  while (i < b.length) {
    if (b[i] !== 0xff) { i++; continue; }
    const m = b[i + 1];
    if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
      return `${b.readUInt16BE(i + 7)}x${b.readUInt16BE(i + 5)}`;
    }
    i += 2 + b.readUInt16BE(i + 2);
  }
  return '?';
};

const lines = [];
for (const d of fs.readdirSync(RAW)) {
  const dir = path.join(RAW, d);
  if (!fs.statSync(dir).isDirectory()) continue;
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.jpg')).sort();
  if (!files.length) { lines.push(`${d}: 0 帧`); continue; }
  const size = jpegSize(fs.readFileSync(path.join(dir, files[0])));
  lines.push(`${d}: ${files.length} 帧 · ${size} · ${size === '390x844' ? 'screencast' : '截图版'}`);
}
fs.writeFileSync('outputs/_rawcheck.txt', lines.join('\n'), 'utf8');
