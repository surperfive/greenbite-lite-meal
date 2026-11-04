/** 抽查局部动效的构图：每段取一帧看裁得对不对。 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

const D = 'outputs/_region2';
fs.mkdirSync(D, { recursive: true });

const shots = [
  ['01-loading-开屏动画.mp4', '1.6', 'c01'],
  ['05-detail-菜品详情开合.mp4', '0.7', 'c05'],
  ['06-gacha-single-盲盒·单抽.mp4', '2.9', 'c06'],
  ['09-banner-首页轮播.mp4', '0.7', 'c09'],
  ['10-homeentry-首页四宫格入口.mp4', '0.7', 'c10'],
  ['11-store-门店选择弹窗.mp4', '1.0', 'c11'],
  ['14-tab-底部导航切换.mp4', '1.1', 'c14'],
  ['16-portion-分量切换.mp4', '3.4', 'c16'],
];

const log = [];
for (const [f, t, tag] of shots) {
  const out = `${D}/${tag}.png`;
  spawnSync('ffmpeg', ['-y', '-ss', t, '-i', `outputs/motion-local/${f}`, '-frames:v', '1', out], { encoding: 'utf8' });
  log.push(`${tag} ${fs.existsSync(out) ? 'OK' : 'FAIL'}`);
}
fs.writeFileSync(`${D}/log.txt`, log.join('\n'), 'utf8');
