/** 从整屏动效片抽帧，用于确定每段的裁切区域。 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

const D = 'outputs/_region';
fs.mkdirSync(D, { recursive: true });

const shots = [
  ['04-cartdrawer-购物车抽屉.mp4', '2.2', 'r04'],
  ['06-gacha-single-盲盒·单抽.mp4', '2.8', 'r06'],
  ['07-gacha-ten-盲盒·十连抽.mp4', '4.6', 'r07'],
  ['08-tokens-抽卡币面板.mp4', '0.8', 'r08'],
  ['09-banner-首页轮播.mp4', '0.6', 'r09'],
  ['10-homeentry-首页四宫格入口.mp4', '0.6', 'r10'],
  ['11-store-门店选择弹窗.mp4', '0.9', 'r11'],
  ['13-healthplan-健康计划弹窗.mp4', '1.2', 'r13'],
  ['14-tab-底部导航切换.mp4', '1.0', 'r14'],
  ['16-portion-分量切换.mp4', '3.2', 'r16'],
  ['17-spec-all-规格全项切换.mp4', '4.5', 'r17'],
];

const log = [];
for (const [f, t, tag] of shots) {
  const out = `${D}/${tag}.png`;
  spawnSync('ffmpeg', ['-y', '-ss', t, '-i', `outputs/motion/${f}`, '-frames:v', '1', out], { encoding: 'utf8' });
  log.push(`${tag} ${fs.existsSync(out) ? 'OK' : 'FAIL'}`);
}
fs.writeFileSync(`${D}/log.txt`, log.join('\n'), 'utf8');
