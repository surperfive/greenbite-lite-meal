/**
 * 点餐头图四角：扩散修补（inpainting），把海报自带的深色圆角底"长"成周围的青柠
 *
 * 为什么不用前面两种做法：
 *  ① 纯色覆盖 → 平涂面积压在点阵上，一眼看出是贴上去的色块（用户否掉）。
 *  ② 镜像补砖 → 左上角紧挨着一个笑脸涂鸦，镜像会把它复制成半个"分身"，更糟。
 *  ③ 放大裁边   → 没有色块，但左右各吃掉 18 CSS px，左边的笑脸被切掉一半。
 *
 * 本方案：只把四角方块里的"深色"像素当空洞，从边界向内逐圈用邻居均值填充，
 * 边界处颜色与周围完全一致（没有接缝），点阵会自然向角落淡出。
 *
 * 深色判定只在四角方块内做，避免误伤海报本身的黑色美术（FOOD 字、轮廓线）。
 *
 * 用法：node scripts/inpaint-banner-corners.mjs [源] [输出]
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, copyFileSync, mkdirSync } from 'node:fs';
import { basename } from 'node:path';

const SRC = process.argv[2] || 'outputs/banner-src/ordering_header_banner.orig-1793169154751.png';
const OUT = process.argv[3] || 'public/ordering_header_banner.png';
// 四角方块边长（源图像素）：略大于深色外缘实测半径 tl≈33 / tr≈21 / bl≈44 / br≈36
const R = { tl: 40, tr: 30, bl: 50, br: 42 };

mkdirSync('outputs/banner-src', { recursive: true });
copyFileSync(SRC, `outputs/banner-src/${basename(SRC, '.png')}.bak-${Date.now()}.png`);

const b64in = readFileSync(SRC).toString('base64');
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage();
await page.goto('about:blank');

const res = await page.evaluate(
  async ({ b64in, R }) => {
    const im = new Image();
    im.src = 'data:image/png;base64,' + b64in;
    await im.decode();
    const W = im.naturalWidth;
    const H = im.naturalHeight;
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(im, 0, 0);
    const img = ctx.getImageData(0, 0, W, H);
    const d = img.data;

    // 1) 只在四角方块里标记"深色"
    const mask = new Uint8Array(W * H);
    let masked = 0;
    const mark = (x0, y0, r) => {
      for (let y = Math.max(0, y0); y < Math.min(H, y0 + r); y++) {
        for (let x = Math.max(0, x0); x < Math.min(W, x0 + r); x++) {
          const i = (y * W + x) * 4;
          if (d[i] < 90 && d[i + 1] < 90 && d[i + 2] < 90) {
            mask[y * W + x] = 1;
            masked++;
          }
        }
      }
    };
    mark(0, 0, R.tl);
    mark(W - R.tr, 0, R.tr);
    mark(0, H - R.bl, R.bl);
    mark(W - R.br, H - R.br, R.br);

    // 1.5) 膨胀 2px：深色与青柠之间还有一圈半透明抗锯齿像素，阈值抓不到它。
    //      不一起盖住的话，填完之后圆弧上会留一道比周围深的细边。
    const dilate = (x0, y0, r) => {
      const add = [];
      for (let y = Math.max(0, y0); y < Math.min(H, y0 + r); y++) {
        for (let x = Math.max(0, x0); x < Math.min(W, x0 + r); x++) {
          const p = y * W + x;
          if (mask[p]) continue;
          let near = false;
          for (let dy = -1; dy <= 1 && !near; dy++) {
            for (let dx = -1; dx <= 1 && !near; dx++) {
              const qx = x + dx;
              const qy = y + dy;
              if (qx < 0 || qx >= W || qy < 0 || qy >= H) continue;
              if (mask[qy * W + qx]) near = true;
            }
          }
          if (near) add.push(p);
        }
      }
      for (const p of add) mask[p] = 1;
      return add.length;
    };
    for (let t = 0; t < 2; t++) {
      masked += dilate(0, 0, R.tl) + dilate(W - R.tr, 0, R.tr) + dilate(0, H - R.bl, R.bl) + dilate(W - R.br, H - R.br, R.br);
    }
    const filled = mask.slice(); // 只对"被修补过的像素"做填充与羽化

    // 2) 取每角的"本地底色"：角落方块内未被标记像素的众数（点阵占少数，众数即底色）。
    //    直接用扩散均值会把深绿圆点一起平均进来，角落变成一团发闷的橄榄绿 —— 这就是
    //    第一版松弛 300 次之后的效果，放大看像一块脏抹布。
    const modeColor = (x0, y0, r) => {
      const hist = new Map();
      for (let y = Math.max(0, y0); y < Math.min(H, y0 + r); y++) {
        for (let x = Math.max(0, x0); x < Math.min(W, x0 + r); x++) {
          const p = y * W + x;
          if (mask[p]) continue;
          const j = p * 4;
          const k = ((d[j] >> 2) << 12) | ((d[j + 1] >> 2) << 6) | (d[j + 2] >> 2);
          hist.set(k, (hist.get(k) || 0) + 1);
        }
      }
      let best = null, bestN = -1;
      for (const [k, n] of hist) if (n > bestN) { bestN = n; best = k; }
      return [((best >> 12) & 63) << 2, ((best >> 6) & 63) << 2, (best & 63) << 2];
    };

    const fills = [
      { box: [0, 0, R.tl] },
      { box: [W - R.tr, 0, R.tr] },
      { box: [0, H - R.bl, R.bl] },
      { box: [W - R.br, H - R.br, R.br] },
    ];
    for (const f of fills) f.color = modeColor(...f.box);

    // 3) 用本地底色填平，再顺着边界羽化几轮（只羽化几像素，不让整体变闷）
    for (const f of fills) {
      const [x0, y0, r] = f.box;
      for (let y = Math.max(0, y0); y < Math.min(H, y0 + r); y++) {
        for (let x = Math.max(0, x0); x < Math.min(W, x0 + r); x++) {
          const p = y * W + x;
          if (!filled[p]) continue;
          const j = p * 4;
          d[j] = f.color[0]; d[j + 1] = f.color[1]; d[j + 2] = f.color[2];
        }
      }
    }

    const NB8 = [-1, 1, -W, W, -W - 1, -W + 1, W - 1, W + 1];
    for (let t = 0; t < 6; t++) {
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const p = y * W + x;
          if (!filled[p]) continue;
          let r = 0, g = 0, b = 0, n = 0;
          for (const o of NB8) {
            const q = p + o;
            if (q < 0 || q >= W * H) continue;
            const qx = q % W;
            if (Math.abs(qx - x) > 1) continue;
            const j = q * 4;
            r += d[j]; g += d[j + 1]; b += d[j + 2]; n++;
          }
          if (!n) continue;
          const j = p * 4;
          d[j] = r / n; d[j + 1] = g / n; d[j + 2] = b / n;
        }
      }
    }

    ctx.putImageData(img, 0, 0);
    return {
      png: c.toDataURL('image/png'),
      masked,
      colors: fills.map((f) => f.color),
      size: `${W}x${H}`,
    };
  },
  { b64in, R }
);

writeFileSync(OUT, Buffer.from(res.png.split(',')[1], 'base64'));
console.log(JSON.stringify({ src: SRC, out: OUT, radii: R, masked: res.masked, colors: res.colors, size: res.size }));
await browser.close();
