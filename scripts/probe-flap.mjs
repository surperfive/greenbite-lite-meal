import { chromium } from 'playwright';
import { BASE } from './_base.mjs';

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
await p.goto(BASE, { waitUntil: 'networkidle' });
await p.waitForTimeout(1500);
await p.locator('#nav-tab-gacha').click();
await p.waitForTimeout(1800);

const s = await p.evaluate(async () => {
  const out = [];
  const t0 = performance.now();
  const tick = () => {
    const d = document.querySelector('#cloche-lifting-dome');
    if (d) {
      const m = new DOMMatrixReadOnly(getComputedStyle(d).transform);
      out.push({
        t: Math.round(performance.now() - t0),
        deg: +((Math.atan2(m.b, m.a) * 180) / Math.PI).toFixed(1),
        y: +m.f.toFixed(1),
        ov: !!document.querySelector('#gacha-burst-overlay'),
      });
    }
    if (performance.now() - t0 < 2800) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  document.querySelector('#btn-gacha-single').click();
  await new Promise((r) => setTimeout(r, 3000));
  return out;
});

console.log('  t(ms)  rotate    y     覆盖层');
for (const e of s) {
  if (e.t > 700) continue;
  console.log(String(e.t).padStart(7), String(e.deg).padStart(8), String(e.y).padStart(7), e.ov ? '  ON' : '');
}

// 统计扑腾：统计 rotate 穿过 0 的次数与峰值
const degs = s.map((e) => e.deg);
let crossings = 0, peak = 0;
for (let i = 1; i < degs.length; i++) if (degs[i - 1] < -1 && degs[i] >= -0.5) crossings++;
for (const d of degs) if (d < peak) peak = d;
console.log('\n扑腾判读：');
console.log('  rotate 峰值（最大抬起角）:', peak, '°');
console.log('  「砸下」次数（从抬起回到 0 附近）:', crossings, crossings >= 3 ? '✓ 至少扑腾 3 下' : '✗ 不足 3 下');
const flap = s.filter((e) => e.t < 700);
console.log('  扑腾段 y 振幅:', (Math.max(...flap.map((e) => e.y)) - Math.min(...flap.map((e) => e.y))).toFixed(1),
  'px（应接近 0 —— 盖子是在盘上拍，不是浮起来拍）');
const ovAt = s.find((e) => e.ov)?.t;
console.log('  覆盖层出现时刻:', ovAt, 'ms');
await b.close();
