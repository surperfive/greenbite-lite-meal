/**
 * 量化「轮廓外的光」：在穹顶左缘扫一条水平线，找到最大梯度点（=轮廓边），
 * 统计它外侧 2~10px 的平均亮度。x 方向不受待机呼吸影响（呼吸是纯 y 位移），
 * 所以同一 y 上两张图的边缘 x 应基本一致，可以直接比外侧亮度。
 * 用法：node scripts/measure-halo.mjs
 */
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

const b64 = (p) => `data:image/png;base64,${readFileSync(p).toString('base64')}`;
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 400, height: 300 } });

const res = await page.evaluate(
  async ([a, b]) => {
    const load = (src) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = src; });
    const ia = await load(a), ib = await load(b);
    const grab = (img) => {
      const c = document.createElement('canvas');
      c.width = img.width; c.height = img.height;
      const g = c.getContext('2d');
      g.drawImage(img, 0, 0);
      return { g, w: img.width, h: img.height };
    };
    const A = grab(ia), B = grab(ib);
    const lum = (d, i) => 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];

    const scan = ({ g, w, h }) => {
      const out = [];
      // 穹顶中段：y 取 0.40~0.52（避开把手和盘沿）
      for (const fy of [0.40, 0.44, 0.48, 0.52]) {
        const y = Math.round(h * fy);
        const row = g.getImageData(0, y, w, 1).data;
        // 在左半幅找最大梯度
        let bestX = -1, best = 0;
        for (let x = Math.round(w * 0.10); x < Math.round(w * 0.55); x++) {
          const d = Math.abs(lum(row, x * 4) - lum(row, (x + 1) * 4));
          if (d > best) { best = d; bestX = x; }
        }
        // 边外侧 2~10px 平均亮度
        let sum = 0, n = 0;
        for (let x = bestX - 10; x <= bestX - 2; x++) { sum += lum(row, x * 4); n++; }
        out.push({ fy, edgeX: bestX, grad: +best.toFixed(1), outsideLum: +(sum / n).toFixed(1) });
      }
      return out;
    };
    return { before: scan(A), after: scan(B) };
  },
  [b64('outputs/before/0-idle-dome.png'), b64('outputs/after/0-idle-dome.png')]
);

console.log('y比例  改动前: 边缘x/梯度/外侧亮度    改动后: 边缘x/梯度/外侧亮度   Δ外侧');
for (let i = 0; i < res.before.length; i++) {
  const a = res.before[i], b = res.after[i];
  console.log(
    `${a.fy.toFixed(2)}   x=${a.edgeX} g=${a.grad} L=${a.outsideLum}      x=${b.edgeX} g=${b.grad} L=${b.outsideLum}      ${(b.outsideLum - a.outsideLum).toFixed(1)}`
  );
}
await browser.close();
