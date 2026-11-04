/**
 * 把改色前后的两张 banner 拼成对照图（按真实渲染宽度 2×）。
 * 用法：node scripts/compare-recolor.mjs
 * 输入：outputs/recolor/before-*.png（改色前的 public 文件）
 *       outputs/recolor/after-*.png  （本次跑出来的 public 文件缩样）
 * 输出：outputs/recolor/compare.png
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const OUT = 'outputs/recolor';
mkdirSync(OUT, { recursive: true });

const ROWS = [
  { label: '我的订单', before: `${OUT}/before-me-order.png`, after: `${OUT}/after-me-order.png`, w: 218 },
  { label: '邀请好友', before: `${OUT}/before-invite.png`, after: `${OUT}/after-invite.png`, w: 382 }
];

const b64 = (p) => `data:image/png;base64,${readFileSync(p).toString('base64')}`;

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage();

const heights = await page.evaluate(async (srcs) => {
  const out = [];
  for (const [b, a] of srcs) {
    const load = (s) => new Promise((res) => {
      const i = new Image();
      i.onload = () => res([i.width, i.height]);
      i.src = s;
    });
    out.push([await load(b), await load(a)]);
  }
  return out;
}, ROWS.map((r) => [b64(r.before), b64(r.after)]));

const res = await page.evaluate(
  async ([rows, sizes]) => {
    const load = (s) => new Promise((res) => {
      const i = new Image();
      i.onload = () => res(i);
      i.src = s;
    });
    const imgs = [];
    for (let k = 0; k < rows.length; k++) {
      imgs.push([await load(rows[k][1]), await load(rows[k][2])]);
    }
    // 每张图按真实渲染宽度 2× 统一
    const PAD = 18, LABEL = 26, GUTTER = 16, SCALE = 2;
    const blocks = [];
    let W = 0;
    for (let k = 0; k < imgs.length; k++) {
      const [b, a] = imgs[k];
      const tw = rows[k][3] * SCALE;
      const bh = Math.round((b.height / b.width) * tw);
      const ah = Math.round((a.height / a.width) * tw);
      blocks.push({ b, a, tw, bh, ah, label: rows[k][0] });
      W = Math.max(W, tw * 2 + GUTTER);
    }
    let Y = PAD;
    let H = PAD;
    for (const bl of blocks) {
      Y += LABEL;
      H = Y + Math.max(bl.bh, bl.ah) + PAD;
      Y = H;
    }
    const c = document.createElement('canvas');
    c.width = W + PAD * 2;
    c.height = H;
    const g = c.getContext('2d');
    g.fillStyle = '#0f172a';
    g.fillRect(0, 0, c.width, c.height);
    g.font = '600 15px system-ui, sans-serif';
    let y = PAD + LABEL - 8;
    for (const bl of blocks) {
      const top = y - LABEL + 8;
      g.fillStyle = '#94a3b8';
      g.fillText(`${bl.label} · 改前`, PAD, top + 14);
      g.fillStyle = '#a3e635';
      g.fillText(`${bl.label} · 改后`, PAD + bl.tw + GUTTER, top + 14);
      g.drawImage(bl.b, PAD, y, bl.tw, bl.bh);
      g.drawImage(bl.a, PAD + bl.tw + GUTTER, y, bl.tw, bl.ah);
      y += Math.max(bl.bh, bl.ah) + PAD;
    }
    return c.toDataURL('image/png');
  },
  [
    ROWS.map((r) => [r.label, b64(r.before), b64(r.after), r.w]),
    heights
  ]
);

const buf = Buffer.from(res.split(',')[1], 'base64');
writeFileSync(`${OUT}/compare.png`, buf);
console.log(`输出 ${OUT}/compare.png  ${(buf.length / 1024).toFixed(0)}KB`);
await browser.close();
