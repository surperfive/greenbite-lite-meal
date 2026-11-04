import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome', args: ['--no-proxy-server'] });
const ctx = await browser.newContext({ viewport: { width: 700, height: 1200 }, deviceScaleFactor: 1 });
await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
const page = await ctx.newPage();
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#nav-tab-gacha', { timeout: 60000 });
await page.waitForTimeout(700);
await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((x) => x.textContent?.trim() === '跳过');
  b?.click();
});
await page.waitForTimeout(1300);
await page.click('#nav-tab-gacha');
await page.waitForTimeout(1300);

const t0 = Date.now();
await page.click('#btn-gacha-ten');
const samples = [];
for (let i = 0; i < 170; i++) {
  const info = await page.evaluate(() => {
    const els = [...document.querySelectorAll('#gacha-burst-overlay [data-reveal-card]')];
    if (!els.length) return null;
    const rs = els.map((e) => e.getBoundingClientRect());
    const l = Math.min(...rs.map((r) => r.left));
    const rr = Math.max(...rs.map((r) => r.right));
    const t = Math.min(...rs.map((r) => r.top));
    const b = Math.max(...rs.map((r) => r.bottom));
    return { n: els.length, w: Math.round(rr - l), h: Math.round(b - t), cx: Math.round((l + rr) / 2), cy: Math.round((t + b) / 2), card: Math.round(rs[0].width) };
  });
  samples.push({ t: Date.now() - t0, info });
  await page.waitForTimeout(50);
}

const vis = samples.filter((s) => s.info && s.info.n >= 10);
if (!vis.length) { console.log('没抓到卡片'); await browser.close(); process.exit(1); }
console.log('卡片首次出现 t =', vis[0].t, 'ms');
// 找最长连续静止区间
let best = { len: 0, s: 0, e: 0 };
let runStart = 0;
for (let i = 1; i <= vis.length; i++) {
  const prev = vis[i - 1], cur = vis[i];
  const same = cur && prev.info.w === cur.info.w && prev.info.cx === cur.info.cx && prev.info.cy === cur.info.cy && prev.info.card === cur.info.card;
  if (!same) {
    const len = prev.t - vis[runStart].t;
    if (len > best.len) best = { len, s: vis[runStart].t, e: prev.t };
    runStart = i;
  }
}
console.log(`最长静止区间: ${best.s}ms -> ${best.e}ms  持续 ${best.len}ms`);
console.log('采样序列（t / 网格宽 / 卡宽）:');
console.log(vis.map((s) => `${s.t}:${s.info.w}/${s.info.card}`).join('  '));
await browser.close();
