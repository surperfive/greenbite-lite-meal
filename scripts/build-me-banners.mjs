/**
 * 从桌面原图重建「我的」页两张 banner，并可把青柠家族整体改到目标色。
 *
 * 用法：
 *   node scripts/build-me-banners.mjs                     # 原样重建（不改色）
 *   node scripts/build-me-banners.mjs --recolor #caf55d   # 青柠家族改到目标色
 *   node scripts/build-me-banners.mjs --hue 66-88         # 自定义色相带（调试用）
 *
 * 为什么要「按 HSL 相对基准」而不是「把一个色换成另一个色」：
 *   素材里的青柠不是单色，是一族（平涂 + 高光 + 阴影 + 描边 + 抗锯齿）。
 *   直接替换单色会只剩一块平板，层次全丢。所以取家族内量化后出现最多的颜色作基准 S，
 *   每个像素只保留它相对 S 的明度差 dL，再贴到目标色的明度上；饱和度按 S_目标/S_基准 等比缩放。
 *   色相容差再做 6° 羽化，避免出现硬边。
 *
 * ⚠️ 色相带必须躲开：吉祥物皇冠（金黄 ~45°）、剪贴板绿色勾（~140°）。
 *
 * 产物：
 *   public/me-order-card.jpg   720×402   （我的订单小卡，object-cover）
 *   public/invite-banner.png   764×186   （邀请好友，透明底）
 *   outputs/recolor/before-*.png  改色前（真实渲染宽度，2×）
 *   outputs/recolor/after-*.png   本次结果（真实渲染宽度，2×）
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const SRC_ME_ORDER = 'C:/Users/OOW/Desktop/watermarked_img_3334290187082487613.jpg';
let SRC_INVITE = 'C:/Users/OOW/.workbuddy-ai/clipboard-images/clipboard-2026-10-19T02-45-27-991Z-34342568.png';

const args = process.argv.slice(2);
const recolorIdx = args.indexOf('--recolor');
const RECOLOR = recolorIdx >= 0 ? args[recolorIdx + 1] : null;
const hueIdx = args.indexOf('--hue');
const [HUE_LO, HUE_HI] = hueIdx >= 0 ? args[hueIdx + 1].split('-').map(Number) : [66, 88];
// 用户自己改过图之后给新源文件，用这两个参数避免手改常量 / 误重建另一张
const inviteIdx = args.indexOf('--invite');
if (inviteIdx >= 0) SRC_INVITE = args[inviteIdx + 1];
const onlyIdx = args.indexOf('--only');
const ONLY = onlyIdx >= 0 ? args[onlyIdx + 1] : null;
const SAT_MIN = 0.18;
/**
 * 亮带下限。HSL 的饱和度在 l→0 时会趋近 1，所以「很暗的偏绿像素」也会算出高饱和度，
 * 邀请好友那张图的黑卡（#0C0C0C 一带）就因此混进青柠家族，把基准色带跑偏成近黑。
 * 加这一刀把黑卡、吉祥物的黑脸、深色描边挡在外面。
 */
const L_MIN = 0.15;

const OUT_DIR = 'outputs/recolor';
mkdirSync(OUT_DIR, { recursive: true });

const JOBS = [
  {
    label: 'me-order',
    title: '我的订单',
    src: SRC_ME_ORDER,
    srcType: 'image/jpeg',
    out: 'public/me-order-card.jpg',
    outType: 'image/jpeg',
    quality: 0.92,
    width: 720,
    renderW: 218,   // col-span-7
    keyWhite: false
  },
  {
    label: 'invite',
    title: '邀请好友',
    src: SRC_INVITE,
    srcType: 'image/png',
    out: 'public/invite-banner.png',
    outType: 'image/png',
    width: 764,
    renderW: 382,   // 整宽
    keyWhite: true
  }
];

const hex2rgb = (hex) => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16)
];

/** 在页面里跑的像素处理函数，全部内联进 evaluate，省得跨上下文传递 */
const pageFn = /* js */ `
async (src, srcType, outType, opts) => {
  const img = new Image();
  img.src = src;
  await img.decode();
  const W = img.width, H = img.height;

  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(img, 0, 0);
  const id = g.getImageData(0, 0, W, H);
  const d = id.data;

  const rgb2hsl = (r, gg, b) => {
    r /= 255; gg /= 255; b /= 255;
    const mx = Math.max(r, gg, b), mn = Math.min(r, gg, b), l = (mx + mn) / 2, dd = mx - mn;
    if (!dd) return [0, 0, l];
    const s = dd / (1 - Math.abs(2 * l - 1));
    let h;
    if (mx === r) h = ((gg - b) / dd) % 6;
    else if (mx === gg) h = (b - r) / dd + 2;
    else h = (r - gg) / dd + 4;
    return [(h * 60 + 360) % 360, s, l];
  };
  const hsl2rgb = (h, s, l) => {
    const cc = (1 - Math.abs(2 * l - 1)) * s;
    const hp = (((h % 360) + 360) % 360) / 60;
    const x = cc * (1 - Math.abs((hp % 2) - 1));
    let r1, g1, b1;
    if (hp < 1) [r1, g1, b1] = [cc, x, 0];
    else if (hp < 2) [r1, g1, b1] = [x, cc, 0];
    else if (hp < 3) [r1, g1, b1] = [0, cc, x];
    else if (hp < 4) [r1, g1, b1] = [0, x, cc];
    else if (hp < 5) [r1, g1, b1] = [x, 0, cc];
    else [r1, g1, b1] = [cc, 0, x];
    const m = l - cc / 2;
    return [(r1 + m) * 255, (g1 + m) * 255, (b1 + m) * 255];
  };
  const inFamily = (h, s, l) => s >= opts.satMin && l >= opts.lMin && h >= opts.hueLo && h <= opts.hueHi;

  // ── ① 抠白底（只对邀请好友这类「元素出界、压在纯白上」的素材）──
  if (opts.keyWhite) {
    const WHITE = 240;
    const seen = new Uint8Array(W * H);
    const stack = [];
    const push = (x, y) => {
      if (x < 0 || y < 0 || x >= W || y >= H) return;
      const p = y * W + x;
      if (seen[p]) return;
      const i = p * 4;
      if (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2] < WHITE) return;
      seen[p] = 1;
      stack.push(p);
    };
    for (let x = 0; x < W; x++) { push(x, 0); push(x, H - 1); }
    for (let y = 0; y < H; y++) { push(0, y); push(W - 1, y); }
    while (stack.length) {
      const p = stack.pop();
      const x = p % W, y = (p - x) / W;
      push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
    }
    for (let p = 0; p < W * H; p++) if (seen[p]) d[p * 4 + 3] = 0;
    // 贴透明区的近白像素羽化，去掉 1~2px 灰白描边
    const a0 = new Uint8Array(W * H);
    for (let p = 0; p < W * H; p++) a0[p] = d[p * 4 + 3];
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const p = y * W + x;
        if (!a0[p]) continue;
        const i = p * 4;
        const L = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        if (L < 236) continue;
        let near = false;
        if (x > 0 && !a0[p - 1]) near = true;
        else if (x < W - 1 && !a0[p + 1]) near = true;
        else if (y > 0 && !a0[p - W]) near = true;
        else if (y < H - 1 && !a0[p + W]) near = true;
        if (near) d[i + 3] = Math.max(0, Math.round(((255 - L) / 19) * 255));
      }
    }
  }

  // ── ② 找青柠家族基准色 ──
  const baseSrc = (() => {
    if (!opts.target) return null;
    const hist = new Map();
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 8) continue;
      const [h, s, l] = rgb2hsl(d[i], d[i + 1], d[i + 2]);
      if (!inFamily(h, s, l)) continue;
      const key = (d[i] >> 5) + ',' + (d[i + 1] >> 5) + ',' + (d[i + 2] >> 5);
      hist.set(key, (hist.get(key) || 0) + 1);
    }
    let bestKey = null, bestN = -1;
    for (const [k, n] of hist) if (n > bestN) { bestN = n; bestKey = k.split(',').map(Number); }
    if (!bestKey) return null;
    let sr = 0, sg = 0, sb = 0, n = 0;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 8) continue;
      if ((d[i] >> 5) === bestKey[0] && (d[i + 1] >> 5) === bestKey[1] && (d[i + 2] >> 5) === bestKey[2]) {
        sr += d[i]; sg += d[i + 1]; sb += d[i + 2]; n++;
      }
    }
    return n ? [sr / n, sg / n, sb / n] : null;
  })();

  const [tR, tG, tB] = opts.target ? [
    parseInt(opts.target.slice(1, 3), 16),
    parseInt(opts.target.slice(3, 5), 16),
    parseInt(opts.target.slice(5, 7), 16)
  ] : [0, 0, 0];
  const [tH, tS, tL] = opts.target ? rgb2hsl(tR, tG, tB) : [0, 0, 0];

  // ── ③ 青柠家族改色 ──
  let touched = 0;
  if (baseSrc) {
    const [bS, bL] = rgb2hsl(...baseSrc).slice(1);
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] === 0) continue;
      const [h, s, l] = rgb2hsl(d[i], d[i + 1], d[i + 2]);
      if (!inFamily(h, s, l)) continue;
      const edge = Math.min(h - opts.hueLo, opts.hueHi - h);
      const w = Math.min(1, edge / 6);
      if (w <= 0) continue;
      const nl = Math.max(0, Math.min(1, tL + (l - bL)));
      const ns = Math.max(0, Math.min(1, s * (tS / Math.max(0.01, bS))));
      const [nr, ng, nb] = hsl2rgb(h, ns, nl);
      d[i] = Math.round(d[i] * (1 - w) + nr * w);
      d[i + 1] = Math.round(d[i + 1] * (1 - w) + ng * w);
      d[i + 2] = Math.round(d[i + 2] * (1 - w) + nb * w);
      if (w > 0.5) touched++;
    }
  }

  // ⚠️ 改色改的是 ImageData 的缓冲区，必须再 putImageData 回画布，
  //    否则下面 drawImage(c, …) 导出的还是改色前的像素。上一个版本漏了这一步，
  //    日志里「命中像素 418086」照样打印，但产出的图一张都没变。
  // ⚠️ 2026-10-28 第二个坑：这行原来写成 if (baseSrc) putImageData(...) ——
  //    只有带 --recolor 时才写回。结果「不改色重建」（第 15 轮还原原图配色）时，
  //    ① 的抠白底照样改了 d 的 alpha，却从没写回画布 → 导出的图 100% 不透明，
  //    白底原样带进页面，黑卡上下各多出一条白框（用户：「去掉白框」）。
  //    bbox 是按 d 算的所以日志看着正常，更具迷惑性。改成：只要动过像素就写回。
  //    （⚠️ 这段注释在 pageFn 模板字符串里，不能出现反引号！）
  if (opts.keyWhite || baseSrc) g.putImageData(id, 0, 0);

  // ── ④ 内容包围盒 + 缩放导出 ──
  let x0 = W, x1 = -1, y0 = H, y1 = -1;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (d[(y * W + x) * 4 + 3] < 8) continue;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
  const scale = opts.width / bw;
  const ow = Math.round(bw * scale), oh = Math.round(bh * scale);

  const o = document.createElement('canvas');
  o.width = ow; o.height = oh;
  const og = o.getContext('2d');
  og.imageSmoothingQuality = 'high';
  og.drawImage(c, x0, y0, bw, bh, 0, 0, ow, oh);
  const dataUrl = o.toDataURL(outType, outType === 'image/jpeg' ? opts.quality : undefined);

  // 真实渲染宽度小图（2×），用于前后对照
  const rs = Math.min(1, (opts.renderW * 2) / ow);
  const small = document.createElement('canvas');
  small.width = Math.round(ow * rs);
  small.height = Math.round(oh * rs);
  small.getContext('2d').drawImage(o, 0, 0, small.width, small.height);

  return {
    W, H,
    box: { x: x0, y: y0, w: bw, h: bh, ratio: +(bw / bh).toFixed(3) },
    baseSrc: baseSrc ? baseSrc.map((v) => Math.round(v)) : null,
    baseSrcHsl: baseSrc ? rgb2hsl(...baseSrc).slice(1).map((v) => +v.toFixed(3)) : null,
    targetHsl: opts.target ? [tH, tS, tL].map((v) => +v.toFixed(3)) : null,
    touched,
    out: { w: ow, h: oh, ratio: +(ow / oh).toFixed(3) },
    dataUrl,
    smallUrl: small.toDataURL('image/png')
  };
}
`;

console.log(
  RECOLOR
    ? `改色：青柠家族（H ${HUE_LO}~${HUE_HI}°）→ ${RECOLOR}\n`
    : '不改色，按原样重建\n'
);

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage();
await page.setContent('<!doctype html><html><body></body></html>');
await page.evaluate(pageFn);

const hex = (a) => '#' + a.map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();

for (const job of ONLY ? JOBS.filter((j) => j.label === ONLY) : JOBS) {
  const b64 = `data:${job.srcType};base64,${readFileSync(job.src).toString('base64')}`;
  const r = await page.evaluate(
    ([fn, src, srcType, outType, opts]) => {
      // eslint-disable-next-line no-eval
      return eval(fn)(src, srcType, outType, opts);
    },
    [
      pageFn,
      b64,
      job.srcType,
      job.outType,
      {
        target: RECOLOR,
        hueLo: HUE_LO,
        hueHi: HUE_HI,
        satMin: SAT_MIN,
        lMin: L_MIN,
        width: job.width,
        renderW: job.renderW,
        keyWhite: job.keyWhite,
        quality: job.quality || 0.92
      }
    ]
  );

  const buf = Buffer.from(r.dataUrl.split(',')[1], 'base64');
  mkdirSync(dirname(job.out), { recursive: true });
  writeFileSync(job.out, buf);
  writeFileSync(`${OUT_DIR}/after-${job.label}.png`, Buffer.from(r.smallUrl.split(',')[1], 'base64'));

  console.log(`${job.title}（${job.label}）`);
  console.log(`  源 ${job.src}`);
  console.log(`  尺寸 ${r.W}×${r.H}  内容 ${r.box.w}×${r.box.h} (${r.box.ratio})`);
  if (r.baseSrc) {
    console.log(`  青柠基准 ${hex(r.baseSrc)}  S ${r.baseSrcHsl[0]} L ${r.baseSrcHsl[1]}`);
    console.log(`  目标      ${RECOLOR}  S ${r.targetHsl[1]} L ${r.targetHsl[2]}`);
    console.log(`  命中像素 ${r.touched}`);
  }
  console.log(`  输出 ${job.out}  ${r.out.w}×${r.out.h} (${r.out.ratio})  ${(buf.length / 1024).toFixed(0)}KB\n`);
}

await browser.close();
console.log(`对照图：${OUT_DIR}/before-*.png（改色前） ${OUT_DIR}/after-*.png（本次）`);
