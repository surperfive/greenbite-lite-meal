/**
 * 光圈前后对比图：静止态 + 掀盖中（550ms）各一组，2×2 拼一张。
 * 用法：node scripts/make-halo-compare.mjs
 */
import { chromium } from 'playwright';
import { readFileSync, mkdirSync } from 'node:fs';

const OUT = 'outputs/halo-compare';
mkdirSync(OUT, { recursive: true });

const cells = [
  ['outputs/before/0-idle-dome.png', '改动前 · 静止'],
  ['outputs/after/0-idle-dome.png', '改动后 · 静止'],
  ['outputs/before/550-draw-dome.png', '改动前 · 掀盖 550ms'],
  ['outputs/after/550-draw-dome.png', '改动后 · 掀盖 550ms'],
];
const b64 = (p) => `data:image/png;base64,${readFileSync(p).toString('base64')}`;

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1300, height: 1000 }, deviceScaleFactor: 1 });

const grid = cells
  .map(
    ([p, label]) =>
      `<figure style="margin:0;position:relative"><figcaption style="color:#e2e8f0;font:12px system-ui;padding:5px 8px">${label}</figcaption><img src="${b64(p)}" style="width:640px;display:block"></figure>`
  )
  .join('');

await page.setContent(
  `<!doctype html><html><body style="margin:0;background:#0b1220"><div style="display:grid;grid-template-columns:640px 640px;gap:6px;padding:6px">${grid}</div></body></html>`
);
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/side-by-side.png`, fullPage: true });
console.log(`输出：${OUT}/side-by-side.png`);
await browser.close();
