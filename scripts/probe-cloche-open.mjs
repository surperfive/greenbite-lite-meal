import { chromium } from 'playwright';
import { BASE } from './_base.mjs';

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
await p.goto(BASE, { waitUntil: 'networkidle' });
await p.waitForTimeout(1500);
await p.locator('#nav-tab-gacha').click();
await p.waitForTimeout(1800);

const out = await p.evaluate(async () => {
  const res = { frames: [], longtasks: [], clickAt: 0, pageNow: 0 };
  try {
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) res.longtasks.push({ start: e.startTime, dur: e.duration });
    }).observe({ entryTypes: ['longtask'] });
  } catch { /* 不支持则跳过 */ }

  const t0 = performance.now();
  res.pageNow = t0;
  let last = t0;
  const tick = () => {
    const now = performance.now();
    res.frames.push({ t: +(now - t0).toFixed(0), gap: +(now - last).toFixed(1) });
    last = now;
    if (now - t0 < 1400) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  res.clickAt = performance.now();
  document.querySelector('#btn-gacha-single').click();
  await new Promise((r) => setTimeout(r, 1600));
  return res;
});

const rel = (abs) => +(abs - out.pageNow).toFixed(0);
console.log('点击发生在采样起点 +', +(out.clickAt - out.pageNow).toFixed(0), 'ms');
const gaps = out.frames.map((f) => f.gap);
const sorted = [...gaps].sort((a, b) => a - b);
const q = (x) => sorted[Math.floor(sorted.length * x)];
console.log('帧数:', out.frames.length, ' p50/p90/p99/max:', q(0.5), q(0.9), q(0.99), sorted[sorted.length - 1]);
console.log('\n>40ms 掉帧（相对点击）:');
for (const f of out.frames) if (f.gap > 40) console.log(`  点击${f.t - (out.clickAt - out.pageNow) >= 0 ? '+' : ''}${(f.t - (out.clickAt - out.pageNow)).toFixed(0)}ms   gap=${f.gap}ms`);
console.log('\nlongtask（相对点击）:');
if (!out.longtasks.length) console.log('  无');
for (const l of out.longtasks) {
  const r = rel(l.start);
  if (r > -1500) console.log(`  点击${r >= 0 ? '+' : ''}${r}ms   阻塞 ${l.dur.toFixed(0)}ms`);
}
await b.close();
