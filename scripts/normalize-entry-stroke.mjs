/**
 * 描边归一化：把四张入口插画的「外轮廓黑描边」在**渲染后**统一到同一粗细。
 *
 * 背景：四张素材的描边相对粗细差很多（实测占画面高 1.74% ~ 3.12%），
 * 再加上两张渲染高 62、两张 72，实际落到屏幕上差近 2 倍（1.25 ~ 2.06px），所以看起来不齐。
 *
 * 做法（闭环校准，不靠公式估算半径）：
 *   1. 从亮度算**软蒙版**（近黑=1，亮部=0），只认描边，不碰彩色填充；
 *   2. 对每个候选半径 r（膨胀/腐蚀各 0..5）真实跑一遍形态学，再用**和
 *      measure-entry-stroke.mjs 完全相同的算法**量一遍渲染后粗细，取最接近目标的那个；
 *   3. 腐蚀时被吃掉的黑色用**由外向内的颜色传播**补底（不是模糊），避免白边光晕；
 *   4. 目标 = 渲染后 1.6px。
 *
 * ⚠️ 为什么必须闭环：软蒙版阈值（亮度 45~95 渐变）与测量阈值（≤90）不是一回事，
 *    第一版按「Δ/2」直接算 r，到店自取从 34 腐蚀到 26（预期 28）、今日抽卡 31→22（预期 25），
 *    结果四张仍差 1.17 倍。改成穷举+实测后才是真的齐。
 *
 * 用法：node scripts/normalize-entry-stroke.mjs
 * 输出：public/entry-norm/*.png（原图不动，随时可回退）
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const TARGET_RENDERED = 1.6; // 目标：屏幕上 1.6px
const MAX_R = 6;             // 最大搜索半径（源图像素）

const JOBS = [
  { file: 'entry-takeout.jpg', out: 'entry-takeout.png', renderedH: 62 },
  { file: 'entry-pickup.jpg', out: 'entry-pickup.png', renderedH: 62 },
  { file: 'entry-benefit.jpg', out: 'entry-benefit.png', renderedH: 72 },
  { file: 'entry-gacha.jpg', out: 'entry-gacha.png', renderedH: 72 },
];

mkdirSync('public/entry-norm', { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 400, height: 300 } });
await page.setContent('<!doctype html><html><body></body></html>');

const rows = [];

for (const job of JOBS) {
  const b64 = `data:image/jpeg;base64,${readFileSync(`public/${job.file}`).toString('base64')}`;

  const res = await page.evaluate(
    async ([src, targetRendered, renderedH, MAX_R]) => {
      const img = await new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = src; });
      const W = img.width, H = img.height;
      const n = W * H;

      const cv = document.createElement('canvas');
      cv.width = W; cv.height = H;
      const ctx = cv.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);
      const srcData = ctx.getImageData(0, 0, W, H).data;

      // ── 软蒙版 ────────────────────────────────────────────────
      const mask = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const p = i * 4;
        const l = 0.299 * srcData[p] + 0.587 * srcData[p + 1] + 0.114 * srcData[p + 2];
        mask[i] = l <= 45 ? 1 : l >= 95 ? 0 : (95 - l) / 50;
      }

      // ── 测量（与 measure-entry-stroke.mjs 完全一致：亮度≤90 视为描边）──
      const measure = (data, w = W, h = H) => {
        const lumAt = (x, y) => {
          const p = (y * w + x) * 4;
          return 0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2];
        };
        const runs = [];
        for (let y = Math.round(h * 0.12); y < h * 0.88; y++) {
          for (const dir of [1, -1]) {
            let x = dir === 1 ? 0 : w - 1;
            const end = dir === 1 ? w : -1;
            while (x !== end && lumAt(x, y) > 90) x += dir;
            if (x === end) continue;
            let c = 0, xx = x;
            while (xx !== end && lumAt(xx, y) <= 90) { c++; xx += dir; }
            if (c >= 3 && c <= 60) runs.push(c);
          }
        }
        if (!runs.length) return 0;
        runs.sort((a, b) => a - b);
        return runs[Math.floor(runs.length / 2)];
      };

      // ── 可分离 max/min 滤波 ───────────────────────────────────
      const morph = (r, isMax) => {
        const tmp = new Float32Array(n);
        for (let y = 0; y < H; y++) {
          const row = y * W;
          for (let x = 0; x < W; x++) {
            let v = isMax ? 0 : 1;
            const x0 = Math.max(0, x - r), x1 = Math.min(W - 1, x + r);
            for (let k = x0; k <= x1; k++) {
              const s = mask[row + k];
              if (isMax ? s > v : s < v) v = s;
            }
            tmp[row + x] = v;
          }
        }
        const out = new Float32Array(n);
        for (let y = 0; y < H; y++) {
          const y0 = Math.max(0, y - r), y1 = Math.min(H - 1, y + r);
          for (let x = 0; x < W; x++) {
            let v = isMax ? 0 : 1;
            for (let k = y0; k <= y1; k++) {
              const s = tmp[k * W + x];
              if (isMax ? s > v : s < v) v = s;
            }
            out[y * W + x] = v;
          }
        }
        return out;
      };

      // ── 颜色传播补底：从已知像素由外向内长，不用模糊（避免白边）──────
      const buildField = (r) => {
        const rgb = new Float32Array(n * 3);
        const known = new Uint8Array(n);
        for (let i = 0; i < n; i++) {
          const p = i * 4;
          rgb[i * 3] = srcData[p];
          rgb[i * 3 + 1] = srcData[p + 1];
          rgb[i * 3 + 2] = srcData[p + 2];
          known[i] = mask[i] > 0.5 ? 0 : 1;
        }
        for (let it = 0; it < r * 2 + 2; it++) {
          const add = [];
          for (let y = 0; y < H; y++) {
            for (let x = 0; x < W; x++) {
              const i = y * W + x;
              if (known[i]) continue;
              let sr = 0, sg = 0, sb = 0, c = 0;
              if (x > 0 && known[i - 1]) { sr += rgb[(i - 1) * 3]; sg += rgb[(i - 1) * 3 + 1]; sb += rgb[(i - 1) * 3 + 2]; c++; }
              if (x < W - 1 && known[i + 1]) { sr += rgb[(i + 1) * 3]; sg += rgb[(i + 1) * 3 + 1]; sb += rgb[(i + 1) * 3 + 2]; c++; }
              if (y > 0 && known[i - W]) { sr += rgb[(i - W) * 3]; sg += rgb[(i - W) * 3 + 1]; sb += rgb[(i - W) * 3 + 2]; c++; }
              if (y < H - 1 && known[i + W]) { sr += rgb[(i + W) * 3]; sg += rgb[(i + W) * 3 + 1]; sb += rgb[(i + W) * 3 + 2]; c++; }
              if (c) add.push(i, sr / c, sg / c, sb / c);
            }
          }
          if (!add.length) break;
          for (let k = 0; k < add.length; k += 4) {
            const i = add[k];
            rgb[i * 3] = add[k + 1];
            rgb[i * 3 + 1] = add[k + 2];
            rgb[i * 3 + 2] = add[k + 3];
            known[i] = 1;
          }
        }
        return rgb;
      };

      // ── 合成 ──────────────────────────────────────────────────
      const render = (r, isDilate) => {
        const newMask = morph(r, isDilate);
        const out = new Uint8ClampedArray(srcData);
        const field = isDilate ? null : buildField(r);
        for (let i = 0; i < n; i++) {
          const p = i * 4;
          const m0 = mask[i], m1 = newMask[i];
          if (isDilate) {
            const a = Math.max(0, m1 - m0);
            if (a > 0) {
              out[p] = srcData[p] * (1 - a);
              out[p + 1] = srcData[p + 1] * (1 - a);
              out[p + 2] = srcData[p + 2] * (1 - a);
            }
          } else {
            const a = Math.max(0, m0 - m1);
            if (a > 0) {
              out[p] = srcData[p] * (1 - a) + field[i * 3] * a;
              out[p + 1] = srcData[p + 1] * (1 - a) + field[i * 3 + 1] * a;
              out[p + 2] = srcData[p + 2] * (1 - a) + field[i * 3 + 2] * a;
            }
          }
        }
        return out;
      };

      // ── 穷举候选，取最接近目标 ──────────────────────────────────
      const curStroke = measure(srcData);
      const wantStroke = targetRendered * (H / renderedH);
      const px = (s) => s * renderedH / H; // 源像素 → 渲染像素

      let best = { r: 0, mode: 'none', stroke: curStroke, data: srcData, err: Math.abs(curStroke - wantStroke) };
      for (const isDilate of [true, false]) {
        for (let r = 1; r <= MAX_R; r++) {
          const data = render(r, isDilate);
          const stroke = measure(data);
          const err = Math.abs(stroke - wantStroke);
          if (err < best.err) best = { r, mode: isDilate ? 'dilate' : 'erode', stroke, data, err };
          // 越做越偏就停（单向单调）
          if (isDilate ? stroke > wantStroke + 4 : stroke < wantStroke - 4) break;
        }
      }

      if (best.r > 0) ctx.putImageData(new ImageData(best.data, W, H), 0, 0);

      // ── 降采样：全分辨率 PNG 每张 1MB，但只显示 62~72px，白扛 ──────────
      // 按 4× 渲染高导出（62 → 248，72 → 288），高 DPR 下仍有余量，
      // 顺带让浏览器少做一次大比例缩放。
      const outH = Math.round(renderedH * 4);
      const outW = Math.round(W * outH / H);
      const small = document.createElement('canvas');
      small.width = outW; small.height = outH;
      const sctx = small.getContext('2d', { willReadFrequently: true });
      sctx.imageSmoothingEnabled = true;
      sctx.imageSmoothingQuality = 'high';
      sctx.drawImage(cv, 0, 0, outW, outH);
      const smallStroke = measure(sctx.getImageData(0, 0, outW, outH).data, outW, outH);

      return {
        W, H, outW, outH, curStroke, wantStroke, bestR: best.r, mode: best.mode,
        gotStroke: best.stroke, smallStroke,
        curPx: px(curStroke), gotPx: px(best.stroke),
        smallPx: smallStroke * renderedH / outH,
        dataUrl: small.toDataURL('image/png'),
      };
    },
    [b64, TARGET_RENDERED, job.renderedH, MAX_R]
  );

  writeFileSync(`public/entry-norm/${job.out}`, Buffer.from(res.dataUrl.split(',')[1], 'base64'));
  rows.push({ job, res });
}

await browser.close();

// ── 报告 ────────────────────────────────────────────────────────
const pad = (s, n) => String(s).padEnd(n);
console.log('\n素材              源尺寸      原描边        处理后        导出        动作');
console.log('─'.repeat(88));
for (const { job, res } of rows) {
  console.log(
    `${pad(job.file, 18)}${pad(`${res.W}×${res.H}`, 12)}` +
    `${pad(`${res.curStroke}px / ${res.curPx.toFixed(2)}`, 14)}` +
    `${pad(`${res.gotStroke}px / ${res.gotPx.toFixed(2)}`, 14)}` +
    `${pad(`${res.outW}×${res.outH}`, 12)}` +
    `${res.bestR ? `${res.mode} r=${res.bestR}` : '无需处理'}`
  );
}
// ⚠️ 离散度按**全分辨率**算。降采样到 4× 渲染高后描边只剩 6~7 源像素，
//    整数行程测量会把它量化成 1.50 / 1.75 这种台阶，是噪声不是真实差异；
//    等比缩放不会改变「描边 : 画面高」的比例，所以全分辨率的值就是最终值。
const px = rows.map((r) => r.res.gotPx);
const spread = Math.max(...px) / Math.min(...px);
const before = rows.map((r) => r.res.curPx);
console.log('─'.repeat(88));
console.log(
  `渲染后描边 ${Math.min(...px).toFixed(2)} ~ ${Math.max(...px).toFixed(2)}px  ` +
  `离散度 ${spread.toFixed(2)}×（处理前 ${(Math.max(...before) / Math.min(...before)).toFixed(2)}×）`
);
console.log('输出目录：public/entry-norm/');
