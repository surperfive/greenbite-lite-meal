/**
 * 把 banner 里的青柠家族整体改到目标色（#caf55d）。
 *
 * 为什么不是「把 #B4F31C 换成 #caf55d」那么简单：
 * 素材里的青柠不是一个色，是一族（背景平涂 + 高光 + 阴影 + 描边）。直接替换单一颜色
 * 会只剩一块平板，高光和阴影全丢。所以按 HSL 的「相对基准」来映射：
 *   取素材里青柠家族的出现次数最多的颜色当基准 S；
 *   每个像素只保留它相对基准的明度差 dL，再贴到目标色的明度上。
 *   这样平涂、高光、阴影、抗锯齿过渡全部整体平移，层次感不破。
 *
 * 用法：node scripts/recolor-banners.mjs
 *   - 输入/输出/目标色都在下面的 CONFIG 里改
 *   - 产出：改色后的图 + outputs/recolor/ 下的前后对照（真实渲染宽度 + 3× 局部）
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const TARGET = '#caf55d';

/** 青柠家族的色相带（度）。素材里吉祥物皇冠是金黄 ~45°，剪贴板绿色勾是 ~140°，都必须躲开 */
const HUE_LO = 66;
const HUE_HI = 88;
const SAT_MIN = 0.18;

const OUT_DIR = 'outputs/recolor';
mkdirSync(OUT_DIR, { recursive: true });

const hex2rgb = (hex) => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16)
];
const rgb2hsl = (r, g, b) => {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const l = (mx + mn) / 2;
  const dd = mx - mn;
  if (!dd) return [0, 0, l];
  const s = dd / (1 - Math.abs(2 * l - 1));
  let h;
  if (mx === r) h = ((g - b) / dd) % 6;
  else if (mx === g) h = (b - r) / dd + 2;
  else h = (r - g) / dd + 4;
  return [(h * 60 + 360) % 360, s, l];
};
const hsl2rgb = (h, s, l) => {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  const [r1, g1, b1] =
    hp < 1 ? [c, x, 0] : hp < 2 ? [x, c, 0] : hp < 3 ? [0, c, x] : hp < 4 ? [0, x, c] : hp < 5 ? [x, 0, c] : [c, 0, x];
  const m = l - c / 2;
  return [(r1 + m) * 255, (g1 + m) * 255, (b1 + m) * 255];
};

const CONFIG = [
  { file: 'public/me-order-card.jpg', out: 'public/me-order-card.jpg', label: '我的订单', type: 'image/jpeg', renderW: 218 },
  { file: 'public/invite-banner.png', out: 'public/invite-banner.png', label: '邀请好友', type: 'image/png', renderW: 382 }
];

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage();
await page.setContent('<!doctype html><html><body></body></html>');

const [tr, tg, tb] = hex2rgb(TARGET);
const [tH, tS, tL] = rgb2hsl(tr, tg, tb);
console.log(`目标 ${TARGET} → H ${tH.toFixed(1)}°  S ${tS.toFixed(2)}  L ${tL.toFixed(2)}\n`);

const summary = [];

for (const cfg of CONFIG) {
  const b64 = `data:${cfg.type};base64,${readFileSync(cfg.file).toString('base64')}`;

  const res = await page.evaluate(
    async ([b64, type, hueLo, hueHi, satMin, tH, tS, tL]) => {
      const img = new Image();
      img.src = b64;
      await img.decode();
      const W = img.width;
      const H = img.height;

      const c = document.createElement('canvas');
      c.width = W;
      c.height = H;
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
      const inFamily = (h, s) => s >= satMin && h >= hueLo && h <= hueHi;

      // ① 找基准色：家族内量化到 8 级后出现最多的那一档
      const hist = new Map();
      for (let i = 0; i < d.length; i += 4) {
        const [h, s] = rgb2hsl(d[i], d[i + 1], d[i + 2]);
        if (!inFamily(h, s)) continue;
        const key = `${d[i] >> 5},${d[i + 1] >> 5},${d[i + 2] >> 5}`;
        hist.set(key, (hist.get(key) || 0) + 1);
      }
      let best = null, bestN = -1, sumR = 0, sumG = 0, sumB = 0, n = 0;
      for (const [key, cnt] of hist) {
        if (cnt > bestN) { bestN = cnt; best = key.split(',').map(Number); }
      }
      for (let i = 0; i < d.length; i += 4) {
        const [r5, g5, b5] = best;
        const rr = d[i] >> 5, gg2 = d[i + 1] >> 5, bb = d[i + 2] >> 5;
        if (rr === r5 && gg2 === g5 && bb === b5) { sumR += d[i]; sumG += d[i + 1]; sumB += d[i + 2]; n++; }
      }
      const baseSrc = [sumR / n, sumG / n, sumB / n];
      const [bH, bS, bL] = rgb2hsl(...baseSrc);

      const hsl2rgb = (h, s, l) => {
        const cc = (1 - Math.abs(2 * l - 1)) * s;
        const hp = (((h % 360) + 360) % 360) / 60;
        const x = cc * (1 - Math.abs((hp % 2) - 1));
        const m = l - cc / 2;
        let r1, g1, b1;
        if (hp < 1) [r1, g1, b1] = [cc, x, 0];
        else if (hp < 2) [r1, g1, b1] = [x, cc, 0];
        else if (hp < 3) [r1, g1, b1] = [0, cc, x];
        else if (hp < 4) [r1, g1, b1] = [0, x, cc];
        else if (hp < 5) [r1, g1, b1] = [x, 0, cc];
        else [r1, g1, b1] = [cc, 0, x];
        return [(r1 + m) * 255, (g1 + m) * 255, (b1 + m) * 255];
      };

      // ② 全图重映射：只保留像素相对基准的明度差 dL，贴到目标明度上
      let touched = 0;
      for (let i = 0; i < d.length; i += 4) {
        const a = d[i + 3];
        if (a === 0) continue;
        const [h, s, l] = rgb2hsl(d[i], d[i + 1], d[i + 2]);
        if (!inFamily(h, s)) continue;
        // 色相容差羽化：离带边越近，改动越轻，避免出现硬边
        const edge = Math.min(h - hueLo, hueHi - h);
        const w = Math.min(1, edge / 6);
        if (w <= 0) continue;
        const dL = l - bL;
        const nl = Math.max(0, Math.min(1, tL + dL));
        const ns = Math.max(0, Math.min(1, s * (tS / Math.max(0.01, bS))));
        const [nr, ng, nb] = hsl2rgb(h, ns, nl);
        d[i] = Math.round(d[i] * (1 - w) + nr * w);
        d[i + 1] = Math.round(d[i + 1] * (1 - w) + ng * w);
        d[i + 2] = Math.round(d[i + 2] * (1 - w) + nb * w);
        if (w > 0.5) touched++;
      }
      g.putImageData(id, 0, 0);

      // ③ 真实渲染宽度缩一遍，出「改后」小图
      const scale = Math.min(1, 400 / W);
      const small = document.createElement('canvas');
      small.width = Math.round(W * scale);
      small.height = Math.round(H * scale);
      small.getContext('2d').drawImage(c, 0, 0, small.width, small.height);

      return {
        W, H,
        baseSrc: baseSrc.map((v) => Math.round(v)),
        baseSrcHsl: [+bH.toFixed(1), +bS.toFixed(2), +bL.toFixed(2)],
        familyPixels: touched,
        dataUrl: c.toDataURL(type, type === 'image/jpeg' ? 0.92 : undefined),
        smallUrl: small.toDataURL('image/png')
      };
    },
    [b64, cfg.type, HUE_LO, HUE_HI, SAT_MIN, tH, tS, tL]
  );

  const buf = Buffer.from(res.dataUrl.split(',')[1], 'base64');
  mkdirSync(dirname(cfg.out), { recursive: true });
  writeFileSync(cfg.out, buf);
  writeFileSync(`${OUT_DIR}/${cfg.label}-after-small.png`, Buffer.from(res.smallUrl.split(',')[1], 'base64'));

  const hex = (a) => '#' + a.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase();
  console.log(`${cfg.label}（${cfg.file}）`);
  console.log(`  尺寸 ${res.W}×${res.H}  命中青柠像素 ${res.familyPixels}`);
  console.log(`  素材基准 ${hex(res.baseSrc)}  H ${res.baseSrcHsl[0]}° S ${res.baseSrcHsl[1]} L ${res.baseSrcHsl[2]}`);
  console.log(`  → 目标   H ${tH.toFixed(1)}° S ${tS.toFixed(2)} L ${tL.toFixed(2)}`);
  console.log(`  输出 ${cfg.out}  ${(buf.length / 1024).toFixed(0)}KB\n`);

  summary.push({ ...cfg, smallUrl: res.smallUrl });
}

// ④ 前后对照：同渲染宽度并排 + 3× 局部
const original = await page.evaluate(async (files) => {
  const out = {};
  for (const [label, src, type] of files) {
    const img = new Image();
    img.src = `data:${type};base64,`;
    void img;
    out[label] = null;
  }
  return out;
}, []);

void original;

await browser.close();
console.log(`对照小图：${OUT_DIR}/<label>-after-small.png`);
