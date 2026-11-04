/** 裁出图鉴弹窗区域，用于「滚动可发现性」案例。 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

const src = 'outputs/checklist-scroll/h932-01-open.png';
const b = fs.readFileSync(src);
// PNG IHDR: width @16, height @20
const w = b.readUInt32BE(16);
const h = b.readUInt32BE(20);

const cutY = Math.round(h * 0.13);
const cutH = Math.round(w * 1.2);
const out = 'outputs/cases/09-scroll.png';

const r = spawnSync('ffmpeg', ['-y', '-i', src, '-vf', `crop=${w}:${cutH}:0:${cutY}`, out], { encoding: 'utf8' });

fs.writeFileSync(
  'outputs/cases/_crop.txt',
  `源 ${w}x${h}\n裁 ${w}x${cutH} @y${cutY}\n结果 ${r.status === 0 && fs.existsSync(out) ? 'OK' : 'FAIL ' + (r.stderr || '').slice(-300)}`,
  'utf8'
);
