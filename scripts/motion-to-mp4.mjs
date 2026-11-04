/**
 * 把 record-motion.mjs 录的 webm 转成可播放的 mp4，并拼一条总览片。
 *
 * 为什么不用 playwright 直出的 webm：
 *   ① webm 是 VP8，微信 / 钉钉 / Windows 默认播放器打不开，用户拿到也看不了；
 *   ② 编码器只在画面变化时出帧，时间戳不均匀，掐头后时长对不上；
 *   ③ 需要固定 30fps，否则快速动效（掀盖、爆闪）会抽帧。
 *
 * 用法：node scripts/motion-to-mp4.mjs
 * 产物：outputs/motion/*.mp4 + 00-全部动效.mp4 + summary.json
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const OUT = 'outputs/motion';
/* 按 key 的数字前缀排序：15-search-dish 是后补场景，在 manifest 里排在 14-tab 之前，
   不排的话总览片的段落顺序会和清单编号对不上。 */
const manifest = JSON.parse(fs.readFileSync(path.join(OUT, 'manifest.json'), 'utf8')).sort(
  (a, b) => Number(String(a.key).slice(0, 2)) - Number(String(b.key).slice(0, 2))
);

const ff = (args) => {
  const r = spawnSync('ffmpeg', args, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  return { ok: r.status === 0, err: (r.stderr || '').split('\n').filter((l) => /error|Invalid|No such/i.test(l)).slice(0, 3).join(' | ') };
};

const probe = (file) => {
  const r = spawnSync(
    'ffprobe',
    ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,nb_frames,r_frame_rate:format=duration', '-of', 'json', file],
    { encoding: 'utf8' }
  );
  try {
    const j = JSON.parse(r.stdout);
    return {
      w: j.streams[0].width,
      h: j.streams[0].height,
      fps: j.streams[0].r_frame_rate,
      frames: Number(j.streams[0].nb_frames || 0),
      duration: Number(j.format.duration || 0),
    };
  } catch {
    return null;
  }
};

const summary = [];
const concatList = [];

for (const m of manifest) {
  const out = path.join(OUT, `${m.key}-${m.title}.mp4`);
  const ss = Math.max(0, Number(m.trimStart || 0)).toFixed(2);
  const slow = Number(m.slowFactor || 1);

  /* 滤镜链：固定 30fps → 慢放（setpts 拉长时间轴）→ 2 倍放大到 780×1688。
     ⚠️ 慢放必须放在 fps 之后、scale 之前：先固定帧率再拉时间轴，慢放时不会重复帧。
     ⚠️ 输出必须重新编码（不能 -c copy）：concat 要求所有片段参数一致，慢放后帧数变了。 */
  const filters = [`fps=30`, slow !== 1 ? `setpts=${slow}*PTS` : null, 'scale=780:1688:flags=lanczos'].filter(Boolean).join(',');

  const args = [
    '-y',
    '-ss', ss,
    '-i', m.raw,
    '-vf', filters,
    '-c:v', 'libx264',
    '-preset', 'slow',
    '-crf', '20',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    '-an',
  ];
  if (m.clipLen) args.push('-t', String(m.clipLen * slow));
  args.push(out);

  const r = ff(args);

  const info = r.ok && fs.existsSync(out) ? probe(out) : null;
  summary.push({
    key: m.key,
    title: m.title,
    note: m.note,
    file: out,
    trimStart: Number(ss),
    duration: info ? Number(info.duration.toFixed(2)) : null,
    frames: info?.frames ?? null,
    sizeKB: fs.existsSync(out) ? Math.round(fs.statSync(out).size / 1024) : null,
    error: r.ok ? m.error : r.err || 'ffmpeg failed',
  });
  if (r.ok) concatList.push(out);
}

/* 总览片：按顺序拼接（转码参数已统一，可直接 concat） */
if (concatList.length > 1) {
  const listFile = path.join(OUT, '_concat.txt');
  fs.writeFileSync(
    listFile,
    concatList.map((f) => `file '${path.resolve(f).replace(/\\/g, '/')}'`).join('\n'),
    'utf8'
  );
  ff([
    '-y',
    '-f', 'concat',
    '-safe', '0',
    '-i', listFile,
    '-c', 'copy',
    '-movflags', '+faststart',
    path.join(OUT, '00-全部动效.mp4'),
  ]);
  fs.rmSync(listFile, { force: true });
}

const total = summary.reduce((a, s) => a + (s.duration || 0), 0);
fs.writeFileSync(
  path.join(OUT, 'summary.json'),
  JSON.stringify({ generatedAt: new Date().toISOString(), count: summary.length, totalSeconds: Number(total.toFixed(1)), clips: summary }, null, 2),
  'utf8'
);
