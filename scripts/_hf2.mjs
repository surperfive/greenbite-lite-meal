/** 局部片段抽帧自查。 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

const dir = 'outputs/motion-hover/_f';
fs.mkdirSync(dir, { recursive: true });
const shots = [
  ['h1-dishcard-菜品卡悬停.mp4', '1.6', 'x1-菜品卡hover'],
  ['h2-addbtn-加号按钮悬停与按下.mp4', '1.5', 'x2-加号hover'],
  ['h2-addbtn-加号按钮悬停与按下.mp4', '2.1', 'x2-加号按下'],
  ['h4-specicon-规格卡图标悬停.mp4', '1.4', 'x4-规格图标'],
  ['h6-navtab-底部导航悬停.mp4', '1.4', 'x6-导航'],
  ['h8-chip-筛选胶囊悬停与按下.mp4', '1.5', 'x8-胶囊'],
];
const log = [];
for (const [f, t, tag] of shots) {
  const out = `${dir}/${tag}.png`;
  spawnSync('ffmpeg', ['-y', '-ss', t, '-i', `outputs/motion-hover/${f}`, '-frames:v', '1', out], { encoding: 'utf8' });
  log.push(`${tag} ${fs.existsSync(out) ? 'OK' : 'FAIL'}`);
}
fs.writeFileSync(`${dir}/log.txt`, log.join('\n'), 'utf8');
