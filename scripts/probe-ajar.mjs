import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
import fs from 'node:fs'; import path from 'node:path';

const OUT = 'probe-out'; fs.mkdirSync(OUT, { recursive: true });
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await p.addInitScript(() => {
  const orig = window.requestAnimationFrame.bind(window);
  window.__frozen = false;
  window.requestAnimationFrame = (cb) => (window.__frozen ? 0 : orig(cb));
});
await p.goto(BASE, { waitUntil: 'networkidle' });
await p.waitForTimeout(1500);
await p.locator('#nav-tab-gacha').click();
await p.waitForTimeout(1800);

await p.locator('#btn-gacha-single').click();
await p.waitForTimeout(1100); // 动画已到位，覆盖层(1350ms)还没接管
await p.evaluate(() => { window.__frozen = true; });
await p.waitForTimeout(150);

const m = await p.evaluate(() => {
  const g = (sel) => {
    const e = document.querySelector(sel);
    if (!e) return null;
    const t = new DOMMatrixReadOnly(getComputedStyle(e).transform);
    const r = e.getBoundingClientRect();
    return {
      rotate: +((Math.atan2(t.b, t.a) * 180) / Math.PI).toFixed(1),
      tx: +t.e.toFixed(1), ty: +t.f.toFixed(1),
      box: { x: +r.x.toFixed(0), y: +r.y.toFixed(0), w: +r.width.toFixed(0), h: +r.height.toFixed(0) },
    };
  };
  return { dome: g('#cloche-lifting-dome'), plate: g('#cloche-and-plate-group') };
});
console.log('餐盖 :', JSON.stringify(m.dome));
console.log('整组 :', JSON.stringify(m.plate));
if (m.dome && m.plate) {
  const gapTop = m.dome.box.y - m.plate.box.y;
  console.log(`盖子顶部相对整组顶部高出 ${gapTop}px（整组高 ${m.plate.box.h}px，占比 ${(gapTop / m.plate.box.h * 100).toFixed(0)}%）`);
}
await p.screenshot({ path: path.join(OUT, 'cloche-ajar.png'), clip: { x: 10, y: 110, width: 370, height: 300 } });
// 盘面特写：确认「露出光」是否读得出来
await p.screenshot({ path: path.join(OUT, 'cloche-ajar-plate.png'), clip: { x: 60, y: 200, width: 300, height: 120 } });
await b.close();
