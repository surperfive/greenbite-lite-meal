import { chromium } from 'playwright';
import { BASE } from './_base.mjs';

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
await p.goto(BASE, { waitUntil: 'networkidle' });
await p.waitForTimeout(1500);
await p.locator('#nav-tab-gacha').click();
await p.waitForTimeout(1800);
await p.locator('#btn-gacha-single').click();
await p.waitForTimeout(6000); // 覆盖层已播完，餐盖应已盖回并进入待机呼吸

// 采样 5s（覆盖一个 4.2s 呼吸周期），看 y 是否仍在摆动
const r = await p.evaluate(async () => {
  const ys = [], degs = [];
  const t0 = performance.now();
  const tick = () => {
    const d = document.querySelector('#cloche-lifting-dome');
    if (d) {
      const m = new DOMMatrixReadOnly(getComputedStyle(d).transform);
      ys.push(m.f);
      degs.push((Math.atan2(m.b, m.a) * 180) / Math.PI);
    }
    if (performance.now() - t0 < 5000) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  await new Promise((r) => setTimeout(r, 5200));
  return {
    yMin: +Math.min(...ys).toFixed(1), yMax: +Math.max(...ys).toFixed(1),
    degMin: +Math.min(...degs).toFixed(2), degMax: +Math.max(...degs).toFixed(2),
    n: ys.length,
  };
});
console.log('终态待机 5s 采样：y ∈', [r.yMin, r.yMax], ' rotate ∈', [r.degMin, r.degMax], ` (${r.n} 帧)`);
console.log(r.yMax - r.yMin > 1 ? '✓ 待机呼吸在跑（y 有摆动）' : '✗ 呼吸没启动 —— onAnimationComplete 可能没触发');
console.log(Math.abs(r.degMax) < 0.3 && Math.abs(r.degMin) < 0.3 ? '✓ 待机不旋转（符合预期）' : '✗ 待机仍有旋转');
await b.close();
