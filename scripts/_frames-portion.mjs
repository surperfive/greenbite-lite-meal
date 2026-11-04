/** 验证分量切换的三个状态：超大杯选中 → 回大杯 → 再超大杯。 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

const file = 'outputs/motion/16-portion-分量切换.mp4';
fs.mkdirSync('outputs/motion/_frames', { recursive: true });
const log = [];
for (const [t, tag] of [
  ['2.4', 'r1-初始'],
  ['4.0', 'r2-超大杯'],
  ['5.2', 'r3-回大杯'],
  ['6.6', 'r4-再超大杯'],
]) {
  const out = `outputs/motion/_frames/${tag}.png`;
  spawnSync('ffmpeg', ['-y', '-ss', t, '-i', file, '-frames:v', '1', out], { encoding: 'utf8' });
  log.push(`${tag} @${t}s ${fs.existsSync(out) ? 'OK' : 'FAIL'}`);
}
fs.writeFileSync('outputs/motion/_frames/log8.txt', log.join('\n'), 'utf8');
