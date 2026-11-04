/**
 * 把 outputs/motion/ 那套「整屏」动效重裁成「只带动画的那块」。
 *
 * 不重新录制 —— raw webm 还在 outputs/motion-raw/，直接从源转码 + crop，
 * 改区域只要重跑这个脚本（几秒），不用再花 2 分钟录一遍。
 *
 * 输出到 outputs/motion-local/，不覆盖原来的整屏版。
 *
 * 用法：node scripts/motion-local.mjs
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const SRC_DIR = 'outputs/motion';
const OUT = 'outputs/motion-local';
const CANVAS = 720;

fs.mkdirSync(OUT, { recursive: true });

/* 每段的裁切区域（CSS px，基于 390×844 视口）。
 * null = 保留全屏，理由写在 note 里。
 * 坐标是目测 + 抽帧校对的，改一个值重跑即可，代价只有几秒。 */
const REGION = {
  '01-loading': { x: 0, y: 150, w: 390, h: 480, why: '开屏 Logo + 海浪进度条，去掉上下空白' },
  '02-pagetransition': null, // 整页加载过场，裁哪一块都会丢掉「揭幕」的过程
  '03-flyorb': { x: 0, y: 236, w: 390, h: 560, why: '菜品卡 → 购物袋，飞球纵跨半屏' },
  '04-cartdrawer': { x: 8, y: 544, w: 374, h: 250, why: '悬浮购物车展开区域' },
  '05-detail': null, // 整页 spring：下层缩到 0.93 是「整页」在动
  '06-gacha-single': { x: 0, y: 96, w: 390, h: 470, why: '抽卡机 + 掀盖 + 结果弹窗' },
  '07-gacha-ten': { x: 0, y: 150, w: 390, h: 470, why: '十连结果网格' },
  '08-tokens': { x: 12, y: 56, w: 366, h: 320, why: '顶部货币面板' },
  '09-banner': { x: 0, y: 0, w: 390, h: 292, why: '首页轮播本身' },
  '10-homeentry': { x: 190, y: 408, w: 196, h: 156, why: '十鲜盲盒入口卡按压反馈' },
  '11-store': { x: 14, y: 110, w: 362, h: 630, why: '门店选择弹窗整体' },
  '12-search': { x: 0, y: 0, w: 390, h: 430, why: '订单搜索框 + 结果列表' },
  '13-healthplan': { x: 14, y: 78, w: 362, h: 610, why: '健康计划弹窗整体' },
  '14-tab': { x: 0, y: 778, w: 390, h: 66, why: '底部导航条' },
  '15-search-dish': { x: 0, y: 0, w: 390, h: 620, why: '搜索面板 + 结果' },
  '16-portion': { x: 8, y: 348, w: 374, h: 110, why: '杯型两张卡' },
  '17-spec-all': { x: 0, y: 330, w: 390, h: 420, why: '规格区（多组连动）' },
};

const manifest = JSON.parse(fs.readFileSync(path.join(SRC_DIR, 'manifest.json'), 'utf8')).sort(
  (a, b) => Number(String(a.key).slice(0, 2)) - Number(String(b.key).slice(0, 2))
);

const even = (n) => Math.max(2, Math.round(n / 2) * 2);

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

for (const m of manifest) {
  const region = REGION[m.key];
  const out = path.join(OUT, `${m.key}-${m.title}.mp4`);
  const ss = Math.max(0, Number(m.trimStart || 0)).toFixed(2);

  const filters = [];
  if (region) {
    const x = even(Math.max(0, Math.min(region.x, 390 - 4)));
    const y = even(Math.max(0, Math.min(region.y, 844 - 4)));
    const w = even(Math.min(region.w, 390 - x));
    const h = even(Math.min(region.h, 844 - y));
    /* 放大策略：最多 4 倍（再高只有插值噪点），且长边不超过画布 720。
       先在 JS 里算好输出尺寸，比在 filter 里写 min() 表达式可靠得多。 */
    const factor = Math.min(4, CANVAS / Math.max(w, h));
    const ow = even(w * factor);
    const oh = even(h * factor);
    filters.push(`crop=${w}:${h}:${x}:${y}`, `scale=${ow}:${oh}:flags=lanczos`);
  } else {
    /* 全屏：源固定 390×844，等比缩到长边 720 → 332×720（取偶）。
       ⚠️ 不要写 `scale='min(720,iw)':-2` —— spawnSync 传参时引号不会去掉，
           ffmpeg 把整串当字面量解析，报 "Error reinitializing filters"。
           这两个全屏片段第一次就是这么挂的。先在 JS 里算好数字最稳。 */
    const f = CANVAS / 844;
    filters.push(`scale=${even(390 * f)}:${even(844 * f)}:flags=lanczos`);
  }
  filters.push(`pad=${CANVAS}:${CANVAS}:(ow-iw)/2:(oh-ih)/2:color=0xF4F6F8`, 'fps=30');

  const r = ff([
    '-y',
    '-ss', ss,
    '-i', m.raw,
    '-vf', filters.join(','),
    '-c:v', 'libx264',
    '-preset', 'slow',
    '-crf', '20',
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
    why: region ? region.why : '全屏：动效本身跨整页，裁切会丢掉动作全貌',
    region: region ? { x: region.x, y: region.y, w: region.w, h: region.h } : 'full',
    file: out,
    duration: info ? Number(info.d.toFixed(2)) : null,
    sizeKB: fs.existsSync(out) ? Math.round(fs.statSync(out).size / 1024) : null,
    error: r.ok ? null : r.err || 'ffmpeg failed',
  });
  if (r.ok) concat.push(out);
}

if (concat.length > 1) {
  const lf = path.join(OUT, '_c.txt');
  fs.writeFileSync(lf, concat.map((f) => `file '${path.resolve(f).replace(/\\/g, '/')}'`).join('\n'), 'utf8');
  ff(['-y', '-f', 'concat', '-safe', '0', '-i', lf, '-c', 'copy', '-movflags', '+faststart', path.join(OUT, '00-局部动效总览.mp4')]);
  fs.rmSync(lf, { force: true });
}

const total = summary.reduce((a, s) => a + (s.duration || 0), 0);
fs.writeFileSync(
  path.join(OUT, 'summary.json'),
  JSON.stringify({ generatedAt: new Date().toISOString(), count: summary.length, totalSeconds: Number(total.toFixed(1)), clips: summary }, null, 2),
  'utf8'
);
