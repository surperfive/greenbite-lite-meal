/**
 * 一次性迁移：把现有的 16-spec-switch（五组规格全点）另存为 17-spec-all，
 * 腾出 16 号给新的「分量切换」。
 * 原因：用户只要看分量变化，但全规格那段里的温度/糖度/加料动效仍有独立价值，
 * 不能因为重录 16 就把它覆盖掉（raw webm 会被 record-motion 的 rmSync 清掉）。
 */
import fs from 'node:fs';

const MANIFEST = 'outputs/motion/manifest.json';
const list = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));

const idx = list.findIndex((m) => m.key === '16-spec-switch');
if (idx < 0) {
  fs.writeFileSync('outputs/_migrate.txt', '未找到 16-spec-switch，无需迁移', 'utf8');
  process.exit(0);
}

const src = list[idx];
const newRaw = 'outputs/motion-raw/17-spec-all.webm';
if (fs.existsSync(src.raw)) fs.copyFileSync(src.raw, newRaw);

list[idx] = {
  ...src,
  key: '17-spec-all',
  title: '规格全项切换',
  note: '杯型 / 温度 / 糖度 / 加料逐项切换，看选中环迁移与金额累加（17.6→20.6→23.6）',
  raw: newRaw,
};

fs.writeFileSync(MANIFEST, JSON.stringify(list, null, 2), 'utf8');
fs.writeFileSync(
  'outputs/_migrate.txt',
  `已迁移：16-spec-switch → 17-spec-all\nraw 复制：${fs.existsSync(newRaw) ? 'OK' : 'FAIL'}\n时长元数据沿用旧值`,
  'utf8'
);
