/** 补一张 9.0s：确认加料是否真的勾上。 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

const out = 'outputs/motion/_frames/q7-加料后.png';
spawnSync('ffmpeg', ['-y', '-ss', '9.2', '-i', 'outputs/motion/16-spec-switch-规格切换.mp4', '-frames:v', '1', out], { encoding: 'utf8' });
fs.writeFileSync('outputs/motion/_frames/log7.txt', fs.existsSync(out) ? 'OK' : 'FAIL', 'utf8');
