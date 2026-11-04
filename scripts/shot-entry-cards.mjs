/**
 * 首页四宫格入口卡：单独截图 + 与参考图并排对比（参考图按卡宽等比缩放到同宽）。
 * 用法：node scripts/shot-entry-cards.mjs
 */
import { chromium } from 'playwright';
import { mkdirSync, readFileSync } from 'node:fs';
import { BASE } from './_base.mjs';

const OUT = 'outputs/entry-compare';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 3 });
await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
const page = await ctx.newPage();

await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#nav-tab-home', { timeout: 60000 });
await page.waitForTimeout(600);
await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((x) => x.textContent?.trim() === '跳过');
  b?.click();
});
await page.waitForTimeout(900);
await page.click('#nav-tab-home');
await page.waitForTimeout(1200);
await page.evaluate(() => { window.requestAnimationFrame = () => 0; });
await page.waitForTimeout(150);

const grid = await page.$('#home-takeout-card');
const gridEl = await grid.evaluateHandle((el) => el.parentElement);
const box = await gridEl.asElement().boundingBox();
await page.screenshot({ path: `${OUT}/cards-app.png`, clip: box, timeout: 60000 });
console.log('app grid', JSON.stringify(box));

// 参考图并排
const appB64 = `data:image/png;base64,${readFileSync(`${OUT}/cards-app.png`).toString('base64')}`;
const refB64 = `data:image/png;base64,${readFileSync('outputs/entry-ref.png').toString('base64')}`;

const cmp = await ctx.newPage();
await cmp.setViewportSize({ width: 1000, height: 700 });
await cmp.setContent(`<!doctype html><html><body style="margin:0;background:#0b1220">
<div style="display:flex;gap:12px;padding:10px;align-items:flex-start">
  <div><div style="color:#e2e8f0;font:12px system-ui;padding:4px">本应用</div><img id="a" style="display:block"></div>
  <div><div style="color:#e2e8f0;font:12px system-ui;padding:4px">参考图（缩到同卡宽）</div><img id="b" style="display:block"></div>
</div>
<script>
const load = (s) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = s; });
window.__go = async (a, b, targetW) => {
  const ia = await load(a), ib = await load(b);
  const A = document.getElementById('a'), B = document.getElementById('b');
  A.src = a; B.src = b;
  // 本应用网格：2 卡 + 6px 间距 → 卡宽 = (W-6)/2
  const appCard = (ia.width - 6) / 2;
  // 参考图：2 卡 287 + 11 间距 + 左右边距 12/8
  const refCard = 287;
  const scale = appCard / refCard;
  const refW = Math.round(ib.width * scale);
  A.style.width = ia.width + 'px';
  B.style.width = refW + 'px';
  await new Promise((r) => setTimeout(r, 60));
  return { appW: ia.width, appCard: +appCard.toFixed(1), refW, refScale: +scale.toFixed(3) };
};
</script></body></html>`);
console.log(await cmp.evaluate(([a, b]) => window.__go(a, b, 0), [appB64, refB64]));
await cmp.waitForTimeout(500);
await cmp.screenshot({ path: `${OUT}/cards-compare.png`, fullPage: true });
console.log(`输出：${OUT}/cards-compare.png`);
await browser.close();
