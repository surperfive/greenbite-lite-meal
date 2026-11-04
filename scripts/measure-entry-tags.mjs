/**
 * 量参考图四张卡左下角的标签胶囊：
 *  · 青柠底卡（外卖/抽卡）→ 第一个胶囊是**黑底**，按「深色」找；
 *  · 白底卡（到店/福利）→ 第一个胶囊是**青柠底**，按「青柠色」找；
 *  · 第二个胶囊都是白底黑字，只在青柠卡上可测（白底卡白胶囊和白卡同色，靠阴影，测不准）。
 * 输出：胶囊的 x/y 区间、宽高、距卡左/下边的距离，以及两胶囊之间的间距。
 * 用法：node scripts/measure-entry-tags.mjs
 */
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

const b64 = `data:image/png;base64,${readFileSync('outputs/entry-ref.png').toString('base64')}`;

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 400, height: 300 } });
await page.setContent('<!doctype html><html><body></body></html>');

const CARDS = [
  { name: 'takeout', x: 12, y: 13, w: 287, h: 205, kind: 'dark' },
  { name: 'pickup', x: 310, y: 13, w: 278, h: 205, kind: 'lime' },
  { name: 'benefit', x: 12, y: 231, w: 287, h: 206, kind: 'lime' },
  { name: 'gacha', x: 310, y: 231, w: 278, h: 206, kind: 'dark' },
];

const out = await page.evaluate(async ([src, cards]) => {
  const img = await new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = src; });
  const c = document.createElement('canvas');
  c.width = img.width; c.height = img.height;
  const g = c.getContext('2d');
  g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, img.width, img.height).data;
  const W = img.width;
  const px = (x, y) => { const i = (y * W + x) * 4; return [d[i], d[i + 1], d[i + 2]]; };

  const res = [];
  for (const k of cards) {
    // 只看左下角：x 6px~55% 卡宽（跳过卡片黑描边）、y 60%~92% 卡高
    const x0 = k.x + 6, x1 = k.x + Math.round(k.w * 0.55);
    const y0 = k.y + Math.round(k.h * 0.60), y1 = k.y + Math.round(k.h * 0.92);
    const cls = (x, y) => {
      const [r, gg, b] = px(x, y);
      const lum = 0.299 * r + 0.587 * gg + 0.114 * b;
      if (k.kind === 'dark') return lum < 80 ? 1 : 0;
      // lime：高绿、低蓝
      return gg > 195 && b < 160 && r > 130 && r < 240 ? 1 : 0;
    };
    const bandH = y1 - y0;
    const colHit = [];
    for (let x = x0; x <= x1; x++) {
      let n = 0;
      for (let y = y0; y <= y1; y++) n += cls(x, y);
      colHit.push(n);
    }
    // 阈值取「峰值的一半」，自适应：胶囊高度只占带宽 1/3 左右，固定比例阈值会漏
    const peak = Math.max(...colHit);
    const thr = Math.max(6, peak * 0.5);
    let bs = -1, bl = 0, cs = -1;
    for (let i = 0; i <= colHit.length; i++) {
      const on = i < colHit.length && colHit[i] > thr;
      if (on && cs < 0) cs = i;
      if (!on && cs >= 0) { if (i - cs > bl) { bl = i - cs; bs = cs; } cs = -1; }
    }
    if (bs < 0) { res.push({ name: k.name, found: false }); continue; }
    const px0 = x0 + bs, px1 = x0 + bs + bl - 1;
    // 行范围：在胶囊 x 区间内统计
    let ry0 = 1e9, ry1 = -1;
    for (let y = y0; y <= y1; y++) {
      let n = 0;
      for (let x = px0; x <= px1; x++) n += cls(x, y);
      if (n > (px1 - px0) * 0.6) { if (y < ry0) ry0 = y; if (y > ry1) ry1 = y; }
    }
    res.push({
      name: k.name,
      found: true,
      pillX: px0 - k.x, pillRight: px1 - k.x,
      pillY: ry0 - k.y, pillBottom: ry1 - k.y,
      pillW: px1 - px0 + 1, pillH: ry1 - ry0 + 1,
      leftFromCard: px0 - k.x,
      bottomFromCard: k.y + k.h - 1 - ry1,
      wPct: +((px1 - px0 + 1) / k.w * 100).toFixed(1),
      hPct: +((ry1 - ry0 + 1) / k.h * 100).toFixed(1),
      bottomPct: +((k.y + k.h - 1 - ry1) / k.h * 100).toFixed(1),
    });
  }
  return res;
}, [b64, CARDS]);

for (const r of out) {
  if (!r.found) { console.log(`${r.name}: 没找到胶囊`); continue; }
  console.log(
    `${r.name.padEnd(8)} 左${r.leftFromCard} 距下${r.bottomFromCard}  ${r.pillW}×${r.pillH}  ` +
    `占卡宽${r.wPct}% 高${r.hPct}% 距下${r.bottomPct}%  y ${r.pillY}~${r.pillBottom}`
  );
}
await browser.close();
