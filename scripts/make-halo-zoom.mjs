/**
 * 光圈局部放大对比：裁餐盖左缘 + 盘沿，3 倍放大并排，专门看「光晕有多宽多亮」。
 * 用法：node scripts/make-halo-zoom.mjs [相对裁切 x y w h]
 */
import { chromium } from 'playwright';
import { readFileSync, mkdirSync } from 'node:fs';

const A = 'outputs/before/0-idle-dome.png';
const B = 'outputs/after/0-idle-dome.png';
const OUT = 'outputs/halo-compare';
mkdirSync(OUT, { recursive: true });

const [cx, cy, cw, ch] = (process.argv[2] ?? '0.10,0.30,0.36,0.52').split(',').map(Number);
const b64 = (p) => `data:image/png;base64,${readFileSync(p).toString('base64')}`;

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1200, height: 1000 }, deviceScaleFactor: 2 });

await page.setContent(`<!doctype html><html><body style="margin:0;background:#111;font:12px system-ui">
<div style="display:flex;gap:6px;padding:6px">
  <div><div style="color:#fff;padding:4px">改动前</div><canvas id="ca"></canvas></div>
  <div><div style="color:#fff;padding:4px">改动后</div><canvas id="cb"></canvas></div>
</div>
<script>
const load = (src) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = src; });
window.__run = async (a, b, cx, cy, cw, ch) => {
  const ia = await load(a), ib = await load(b);
  const x = Math.round(ia.width * cx), y = Math.round(ia.height * cy);
  const w = Math.round(ia.width * cw), h = Math.round(ia.height * ch);
  const Z = 3;
  for (const [img, id] of [[ia,'ca'],[ib,'cb']]) {
    const c = document.getElementById(id);
    c.width = w * Z; c.height = h * Z;
    c.style.width = (w * Z) + 'px'; c.style.height = (h * Z) + 'px';
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.drawImage(img, x, y, w, h, 0, 0, w * Z, h * Z);
  }
  return { x, y, w, h, Z };
};
</script></body></html>`);
const info = await page.evaluate(
  ([a, b, cx, cy, cw, ch]) => window.__run(a, b, cx, cy, cw, ch),
  [b64(A), b64(B), cx, cy, cw, ch]
);
console.log('crop', info);
await page.waitForTimeout(200);
await page.screenshot({ path: `${OUT}/zoom.png`, fullPage: true });
console.log(`输出：${OUT}/zoom.png`);
await browser.close();
