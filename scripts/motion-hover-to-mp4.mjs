/**
 * 把 CDP 抓下来的 jpg 帧序列裁成「只有动效那一块」的 mp4。
 *
 * 帧序列是 3 倍分辨率（1170×2532），所以裁切坐标要按 box × 3 换算；
 * 裁完居中放到统一 720×720 画布，方便逐段看、也方便拼总览。
 *
 * 用法：node scripts/motion-hover-to-mp4.mjs
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const OUT = 'outputs/motion-hover';
const CANVAS = 720;

const list = JSON.parse(fs.readFileSync(path.join(OUT, 'manifest.json'), 'utf8')).sort((a, b) =>
  String(a.key).localeCompare(String(b.key))
);

const ff = (args) => {
  const r = spawnSync('ffmpeg', args, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  return { ok: r.status === 0, err: (r.stderr || '').split('\n').filter((l) => /error|Invalid|No such/i.test(l)).slice(0, 2).join(' |') };
};

const probe = (file) => {
  const r = spawnSync(
    'ffprobe',
    ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height:format=duration', '-of', 'json', file],
    { encoding: 'utf8' }
  );
  try {
    const j = JSON.parse(r.stdout);
    return { w: j.streams[0].width, h: j.streams[0].height, d: Number(j.format.duration) };
  } catch {
    return null;
  }
};

const summary = [];
const concat = [];

for (const m of list) {
  if (m.error || !m.box || !m.frames) {
    summary.push({ key: m.key, title: m.title, file: null, error: m.error || 'no frames' });
    continue;
  }

  const out = path.join(OUT, `${m.key}-${m.title}.mp4`);
  const input = path.join(m.dir, 'f%05d.jpg');

  const pad = m.pad || 10;
  /* 裁切框：box + pad，clamp 到 390×844 内。
     ⚠️ 帧是 screencast 出的**视口尺寸**（390×844），不是 3 倍图 ——
        按 3 倍换算会直接越界，ffmpeg 报 "Invalid too big or non positive size"。
        这个坑踩过一次：8 段里有 4 段因此没转出来。
     ⚠️ x/y/w/h 全部取偶：libx264 的 yuv420p 遇到奇数会失败。 */
  const cx0 = Math.max(0, Math.min(m.box.x - pad, 390 - 4));
  const cy0 = Math.max(0, Math.min(m.box.y - pad, 844 - 4));
  const x = 2 * Math.round(cx0 / 2);
  const y = 2 * Math.round(cy0 / 2);
  const w = 2 * Math.round(Math.min(m.box.w + pad * 2, 390 - x) / 2);
  const h = 2 * Math.round(Math.min(m.box.h + pad * 2, 844 - y) / 2);

  /* 滤镜链：
     ① crop  —— 只留动效那一块
     ② scale —— 最多放大 4 倍，且不超过画布 720（h=-2 保持比例、自动取偶）
     ③ pad   —— 居中放到 720×720，底色用页面底色 #F4F6F8
     ④ fps   —— 统一 30，和整屏那套动效片一致
     4 倍是清晰度临界点：24px 的加号裁完 48px，×4 = 192px 还能看；6 倍就糊成色块了。 */
  const vf = [
    `crop=${w}:${h}:${x}:${y}`,
    `scale=w='min(iw*4,${CANVAS})':h=-2:flags=lanczos`,
    `pad=${CANVAS}:${CANVAS}:(ow-iw)/2:(oh-ih)/2:color=0xF4F6F8`,
    'fps=30',
  ].join(',');

  const r = ff([
    '-y',
    '-framerate', String(m.fps || 60),
    '-i', input,
    '-vf', vf,
    '-c:v', 'libx264',
    '-preset', 'slow',
    '-crf', '19',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    '-an',
    out,
  ]);

  const info = r.ok && fs.existsSync(out) ? probe(out) : null;
  summary.push({
    key: m.key,
    title: m.title,
    note: m.note,
    file: out,
    crop: { x, y, w, h },
    duration: info ? Number(info.d.toFixed(2)) : null,
    sizeKB: fs.existsSync(out) ? Math.round(fs.statSync(out).size / 1024) : null,
    error: r.ok ? null : r.err || 'ffmpeg failed',
  });
  if (r.ok) concat.push(out);
}

if (concat.length > 1) {
  const lf = path.join(OUT, '_c.txt');
  fs.writeFileSync(lf, concat.map((f) => `file '${path.resolve(f).replace(/\\/g, '/')}'`).join('\n'), 'utf8');
  ff(['-y', '-f', 'concat', '-safe', '0', '-i', lf, '-c', 'copy', '-movflags', '+faststart', path.join(OUT, '00-hover总览.mp4')]);
  fs.rmSync(lf, { force: true });
}

const total = summary.reduce((a, s) => a + (s.duration || 0), 0);
fs.writeFileSync(
  path.join(OUT, 'summary.json'),
  JSON.stringify({ generatedAt: new Date().toISOString(), count: summary.length, totalSeconds: Number(total.toFixed(1)), clips: summary }, null, 2),
  'utf8'
);
