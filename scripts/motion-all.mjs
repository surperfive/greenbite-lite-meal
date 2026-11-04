/**
 * 把所有动效汇总到一起：
 *   ① 拼一条总片（局部 17 段 + 悬停 8 段 = 25 段，统一 720×720，可直接 concat）
 *   ② 生成一个可逐段点播的 HTML 索引页
 *
 * 用法：node scripts/motion-all.mjs
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ALL = 'outputs/motion-all';
fs.mkdirSync(ALL, { recursive: true });

const local = JSON.parse(fs.readFileSync('outputs/motion-local/summary.json', 'utf8')).clips;
const hover = JSON.parse(fs.readFileSync('outputs/motion-hover/summary.json', 'utf8')).clips;

const byKey = (list) => [...list].sort((a, b) => String(a.key).localeCompare(String(b.key)));
const clips = [...byKey(local), ...byKey(hover)].filter((c) => c.file && !c.error);

const ff = (args) => {
  const r = spawnSync('ffmpeg', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  return { ok: r.status === 0, err: (r.stderr || '').split('\n').filter((l) => /error|Invalid/i.test(l)).slice(0, 2).join(' |') };
};

/* ① 拼接总片：两套都是 720×720 / h264 / 30fps，参数一致，可直接 copy */
const listFile = path.join(ALL, '_c.txt');
fs.writeFileSync(
  listFile,
  clips.map((c) => `file '${path.resolve(c.file).replace(/\\/g, '/')}'`).join('\n'),
  'utf8'
);
const concatOut = path.join(ALL, '00-全部动效合集.mp4');
const cr = ff(['-y', '-f', 'concat', '-safe', '0', '-i', listFile, '-c', 'copy', '-movflags', '+faststart', concatOut]);
fs.rmSync(listFile, { force: true });

const total = clips.reduce((a, c) => a + (c.duration || 0), 0);
const concatKB = fs.existsSync(concatOut) ? Math.round(fs.statSync(concatOut).size / 1024) : 0;

/* ② 分组：按业务顺序，而不是文件序号 */
const GROUPS = [
  { id: 'open', name: '开屏与转场', desc: '品牌首屏 + 页面切换的加载过场', keys: ['01-loading', '02-pagetransition'] },
  { id: 'order', name: '点餐主流程', desc: '加购飞球、购物车抽屉、详情开合、规格切换', keys: ['03-flyorb', '04-cartdrawer', '05-detail', '16-portion', '17-spec-all'] },
  { id: 'gacha', name: '十鲜盲盒', desc: '单抽 / 十连 / 抽卡币面板', keys: ['06-gacha-single', '07-gacha-ten', '08-tokens'] },
  { id: 'home', name: '首页与搜索', desc: '轮播、四宫格入口、两套搜索', keys: ['09-banner', '10-homeentry', '12-search', '15-search-dish'] },
  { id: 'modal', name: '弹窗', desc: '门店选择 / 健康计划', keys: ['11-store', '13-healthplan'] },
  { id: 'nav', name: '底部导航', desc: '五个 tab 的选中态迁移', keys: ['14-tab'] },
  { id: 'hover', name: '悬停与按压', desc: '鼠标悬停、按下反馈，只截动效那一块', keys: ['h1-dishcard', 'h2-addbtn', 'h3-fav', 'h4-specicon', 'h5-specrow', 'h6-navtab', 'h7-more', 'h8-chip'] },
];

const map = new Map(clips.map((c) => [c.key, c]));
/* 索引页放在 outputs/ 根，所以视频路径统一写成「相对 outputs/」的形式 */
const rel = (f) => path.relative(path.resolve('outputs'), path.resolve(f)).replace(/\\/g, '/');

const groupHtml = GROUPS.map((g) => {
  const items = g.keys.map((k) => map.get(k)).filter(Boolean);
  if (!items.length) return '';
  const cards = items
    .map((c, i) => {
      const src = rel(c.file);
      return `<figure class="card" data-src="${src}">
        <div class="frame"><video src="${src}" muted loop playsinline preload="metadata"></video><button class="play" aria-label="播放">▶</button></div>
        <figcaption>
          <span class="idx">${String(i + 1).padStart(2, '0')}</span>
          <b>${c.title}</b>
          <span class="meta">${c.duration}s${c.region === 'full' ? ' · 全屏' : c.region ? ` · ${c.region.w}×${c.region.h}` : c.crop ? ` · ${c.crop.w}×${c.crop.h}` : ''}</span>
          <p>${c.note || ''}</p>
        </figcaption>
      </figure>`;
    })
    .join('\n');
  return `<section class="group" id="${g.id}">
    <header><h2>${g.name}</h2><span>${g.desc}</span><em>${items.length} 段</em></header>
    <div class="grid">${cards}</div>
  </section>`;
}).join('\n');

const navHtml = GROUPS.map((g) => `<a href="#${g.id}">${g.name}</a>`).join('');

const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>GreenBite 动效总览</title>
<style>
  :root{
    --lime:#C7F665; --lime-700:#54801A; --ink:#070906; --red:#FC5294;
    --bg:#F4F6F8; --card:#fff; --line:#E2E8F0; --muted:#64748B;
  }
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--ink);
    font-family:'Plus Jakarta Sans','Noto Sans SC',system-ui,-apple-system,'Segoe UI',sans-serif;}
  .wrap{max-width:1180px;margin:0 auto;padding:40px 24px 80px}
  h1{font-size:30px;margin:0 0 6px;letter-spacing:-.02em}
  .sub{color:var(--muted);font-size:13px;margin:0 0 26px}
  .hero{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:30px}
  .stat{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:12px 18px;font-size:12px;color:var(--muted)}
  .stat b{display:block;font-size:22px;color:var(--ink);letter-spacing:-.01em;margin-top:2px}
  .stat.hi{background:var(--lime);border-color:transparent}
  .stat.hi b,.stat.hi{color:var(--ink)}
  nav{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:34px}
  nav a{font-size:12px;font-weight:700;text-decoration:none;color:var(--ink);
    background:#fff;border:1px solid var(--line);border-radius:999px;padding:7px 14px;transition:.18s}
  nav a:hover{background:var(--lime);border-color:transparent}
  .group{margin-bottom:46px}
  .group header{display:flex;align-items:baseline;gap:10px;margin-bottom:14px}
  .group h2{font-size:17px;margin:0;letter-spacing:-.01em}
  .group header span{font-size:12px;color:var(--muted)}
  .group header em{margin-left:auto;font-style:normal;font-size:11px;font-weight:800;color:var(--lime-700);
    background:#F2FCE0;padding:3px 9px;border-radius:999px}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:16px}
  .card{margin:0;background:var(--card);border:1px solid var(--line);border-radius:18px;overflow:hidden;
    transition:transform .2s,box-shadow .2s}
  .card:hover{transform:translateY(-2px);box-shadow:0 10px 26px rgba(7,9,6,.08)}
  .frame{position:relative;background:#EEF1F4;aspect-ratio:1/1;display:flex;align-items:center;justify-content:center}
  .frame video{width:100%;height:100%;object-fit:contain;display:block}
  .play{position:absolute;inset:0;margin:auto;width:52px;height:52px;border-radius:50%;border:0;
    background:rgba(7,9,6,.72);color:#fff;font-size:16px;cursor:pointer;opacity:0;transition:.18s;
    display:flex;align-items:center;justify-content:center;padding-left:3px}
  .frame:hover .play{opacity:1}
  .card.playing .play{opacity:0}
  figcaption{padding:12px 14px 15px}
  .idx{display:inline-block;font-size:10px;font-weight:900;color:#fff;background:var(--red);
    border-radius:6px;padding:2px 6px;margin-right:7px;vertical-align:2px}
  figcaption b{font-size:13.5px;letter-spacing:-.01em}
  .meta{display:block;font-size:11px;color:var(--muted);margin:6px 0 0;font-variant-numeric:tabular-nums}
  figcaption p{margin:7px 0 0;font-size:11.5px;line-height:1.55;color:#475569}
  .hero-video{background:#111;border-radius:20px;overflow:hidden;margin:0 auto 34px;border:1px solid #000;
    max-width:460px;box-shadow:0 12px 30px rgba(7,9,6,.12)}
  .hero-video video{display:block;width:100%;background:#000}
  .hero-cap{padding:11px 16px;background:#0B0F0C;color:#9CA3AF;font-size:11.5px;display:flex;gap:12px;align-items:center}
  .hero-cap b{color:#fff;font-size:12.5px}
  .hero-cap a{margin-left:auto;color:var(--lime);text-decoration:none;font-weight:700}
  footer{margin-top:20px;font-size:11.5px;color:var(--muted);line-height:1.8}
</style>
</head>
<body>
<div class="wrap">
  <h1>GreenBite 动效总览</h1>
  <p class="sub">全部动效录屏汇总 · 每条只保留动效发生的区域 · 悬停卡片可预览，点击播放</p>

  <div class="hero">
    <div class="stat hi"><b>${clips.length}</b>段动效</div>
    <div class="stat"><b>${total.toFixed(1)}s</b>总时长</div>
    <div class="stat"><b>${clips.filter((c) => c.region === 'full').length}</b>段为全屏（动效跨整页）</div>
    <div class="stat"><b>720×720</b>统一画布</div>
    <div class="stat"><b>${(concatKB / 1024).toFixed(1)}MB</b>合集体积</div>
  </div>

  <nav>${navHtml}</nav>

  <div class="hero-video">
    <video src="motion-all/00-全部动效合集.mp4" controls preload="metadata" playsinline></video>
    <div class="hero-cap"><b>00-全部动效合集</b> 按下方顺序连播 · ${total.toFixed(1)}s
      <a href="motion-all/00-全部动效合集.mp4" download>下载</a></div>
  </div>
  ${groupHtml}

  <footer>
    生成于 ${new Date().toISOString().slice(0, 16).replace('T', ' ')} ·
    源素材 outputs/motion（整屏）、outputs/motion-local（局部重裁）、outputs/motion-hover（悬停）<br>
    复跑：node scripts/motion-all.mjs
  </footer>
</div>
<script>
  document.querySelectorAll('.frame').forEach((f) => {
    const v = f.querySelector('video');
    const btn = f.querySelector('.play');
    /* 首帧多为白底或过渡态，跳一点进度当封面 —— 卡片上直接能看出内容 */
    v.addEventListener('loadedmetadata', () => {
      try { v.currentTime = Math.min(0.8, (v.duration || 1) * 0.25); } catch {}
    });
    const toggle = () => {
      if (v.paused) { v.play(); f.closest('.card').classList.add('playing'); }
      else { v.pause(); v.currentTime = 0; f.closest('.card').classList.remove('playing'); }
    };
    btn.addEventListener('click', (e) => { e.stopPropagation(); toggle(); });
    f.addEventListener('click', toggle);
    v.addEventListener('ended', () => f.closest('.card').classList.remove('playing'));
  });
</script>
</body>
</html>`;

/* 索引页写到 outputs/ 根：这样视频相对路径（motion-local/x.mp4、motion-all/00.mp4）都能直接解析，
   双击打开就能播，不需要起本地服务器。 */
fs.writeFileSync('outputs/动效总览.html', html, 'utf8');

fs.writeFileSync(
  path.join(ALL, 'sum.json'),
  JSON.stringify({ generatedAt: new Date().toISOString(), clips: clips.length, totalSeconds: Number(total.toFixed(1)), concat: concatOut, concatKB, ok: cr.ok, err: cr.err }, null, 2),
  'utf8'
);
