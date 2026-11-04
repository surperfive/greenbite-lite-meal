/** 抽帧看局部裁切效果。 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

fs.mkdirSync('outputs/motion-hover/_f', { recursive: true });
const shots = [
  ['h2-addbtn-加号按钮悬停 + 按下.mp4', '0.6', 'a-idle'],
  ['h2-addbtn-加号按钮悬停 + 按下.mp4', '1.4', 'a-hover'],
  ['h2-addbtn-加号按钮悬停 + 按下.mp4', '2.0', 'a-active'],
  ['h6-navtab-底部导航悬停.mp4', '1.3', 'n-hover'],
];
const log = [];
for (const [f, t, tag] of shots) {
  const out = `outputs/motion-hover/_f/${tag}.png`;
  spawnSync('ffmpeg', ['-y', '-ss', t, '-i', `outputs/motion-hover/${f}`, '-frames:v', '1', out], { encoding: 'utf8' });
  log.push(`${tag} @${t}s ${fs.existsSync(out) ? 'OK' : 'FAIL'}`);
}
fs.writeFileSync('outputs/motion-hover/_f/log.txt', log.join('\n'), 'utf8');
