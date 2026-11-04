/**
 * 量一张「成品卡面图」里实际卡片的包围盒（去掉四周白边），并按包围盒裁切导出。
 * 用法：
 *   node scripts/crop-art-card.mjs <源图> --measure
 *   node scripts/crop-art-card.mjs <源图> <输出> [目标宽] [内缩px] [质量]
 *
 * 内缩（inset）的意义：成品图的黑卡自带圆角，如果按包围盒精确裁，
 * 裁完的四角仍留着「圆角之外的白三角」；把裁切框往内缩 6~10px，
 * 圆角被切掉、四角变成纯色直角，交给容器的 `rounded-[24px]` 去圆，才不会露白。
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const [src, out, wArg, insetArg, qArg] = process.argv.slice(2);
const MEASURE = process.argv.includes('--measure');
const TARGET_W = Number(wArg) || 0;
const INSET = Number(insetArg) || 0;
const QUALITY = Number(qArg) || 88;

const mime = src.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
const b64 = `data:${mime};base64,${readFileSync(src).toString('base64')}`;

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage();
await page.setContent('<!doctype html><html><body></body></html>');

const res = await page.evaluate(
  async ([src, targetW, inset, quality, measureOnly]) => {
    const img = new Image();
    img.src = src;
    await img.decode();
    const W = img.width;
    const H = img.height;

    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, W, H).data;

    const px = (x, y) => {
      const i = (y * W + x) * 4;
      return [d[i], d[i + 1], d[i + 2], d[i + 3]];
    };
    // 判定「不是白底」：亮度 < 244 或 alpha < 250
    const isInk = (x, y) => {
      const [r, gg, b, a] = px(x, y);
      return a < 250 || 0.299 * r + 0.587 * gg + 0.114 * b < 244;
    };

    let x0 = W, x1 = -1, y0 = H, y1 = -1;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (!isInk(x, y)) continue;
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
    const bbox = {
      x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1,
      ratio: +((x1 - x0 + 1) / (y1 - y0 + 1)).toFixed(3),
      leftPct: +((x0 / W) * 100).toFixed(1),
      rightPct: +(((W - 1 - x1) / W) * 100).toFixed(1),
      topPct: +((y0 / H) * 100).toFixed(1),
      bottomPct: +(((H - 1 - y1) / H) * 100).toFixed(1)
    };

    if (measureOnly) return { W, H, ratio: +(W / H).toFixed(3), bbox };

    const cx = x0 + inset;
    const cy = y0 + inset;
    const cw = bbox.w - inset * 2;
    const ch = bbox.h - inset * 2;
    const scale = targetW / cw;
    const ow = Math.round(cw * scale);
    const oh = Math.round(ch * scale);

    const o = document.createElement('canvas');
    o.width = ow;
    o.height = oh;
    const og = o.getContext('2d');
    og.imageSmoothingQuality = 'high';
    og.drawImage(c, cx, cy, cw, ch, 0, 0, ow, oh);
    return {
      W, H, ratio: +(W / H).toFixed(3), bbox,
      crop: { x: cx, y: cy, w: cw, h: ch, ratio: +(cw / ch).toFixed(3) },
      out: { w: ow, h: oh, ratio: +(ow / oh).toFixed(3) },
      dataUrl: o.toDataURL('image/jpeg', quality / 100)
    };
  },
  [b64, TARGET_W, INSET, QUALITY, MEASURE]
);

if (MEASURE) {
  console.log(JSON.stringify(res, null, 2));
} else {
  const buf = Buffer.from(res.dataUrl.split(',')[1], 'base64');
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, buf);
  console.log(`源 ${res.W}×${res.H} (${res.ratio})`);
  console.log(`卡片包围盒 x${res.bbox.x} y${res.bbox.y} ${res.bbox.w}×${res.bbox.h} (${res.bbox.ratio})`);
  console.log(`四周白边 左${res.bbox.leftPct}% 右${res.bbox.rightPct}% 上${res.bbox.topPct}% 下${res.bbox.bottomPct}%`);
  console.log(`内缩 ${INSET}px → 裁切 ${res.crop.w}×${res.crop.h} (${res.crop.ratio})`);
  console.log(`输出 ${out}  ${res.out.w}×${res.out.h} (${res.out.ratio})  ${(buf.length / 1024).toFixed(0)}KB`);
}

await browser.close();
