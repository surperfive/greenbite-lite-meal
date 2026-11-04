import { spawnSync } from 'child_process';
const D = 'outputs/align2';
// before：strip-menu.png（改动前，x0..140, y0..844 @3x）；裁 y 90..330 CSS -> 270..990 px
const r1 = spawnSync('ffmpeg', ['-y', '-i', `${D}/strip-menu.png`, '-vf', 'crop=420:720:0:270', `${D}/_before.png`], { encoding: 'utf8' });
// after：strip2-menu.png 已是 420x720
const r2 = spawnSync(
  'ffmpeg',
  ['-y', '-i', `${D}/_before.png`, '-i', `${D}/strip2-menu.png`, '-filter_complex', 'hstack=inputs=2', '-b:v', '6M', `${D}/compare-menu.png`],
  { encoding: 'utf8' }
);
console.log(r1.status, r2.status, (r1.stderr || '').slice(-200), (r2.stderr || '').slice(-200));
