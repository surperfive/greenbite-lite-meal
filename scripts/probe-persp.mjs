import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
import fs from 'node:fs'; import path from 'node:path';

const OUT = 'probe-out'; fs.mkdirSync(OUT, { recursive: true });
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
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
await p.waitForTimeout(1650); // 动画现在 1.4s，取掀开后的定态
await p.evaluate(() => { window.__frozen = true; });
await p.waitForTimeout(150);

// 把盘沿、穹顶底缘、穹顶包围盒一起量出来，便于判断透视错在哪
const geo = await p.evaluate(() => {
  const box = (sel) => {
    const e = document.querySelector(sel);
    if (!e) return null;
    const r = e.getBoundingClientRect();
    return { x: +r.x.toFixed(0), y: +r.y.toFixed(0), w: +r.width.toFixed(0), h: +r.height.toFixed(0) };
  };
  const tf = (sel) => {
    const e = document.querySelector(sel);
    if (!e) return null;
    const m = new DOMMatrixReadOnly(getComputedStyle(e).transform);
    return {
      rot: +((Math.atan2(m.b, m.a) * 180) / Math.PI).toFixed(1),
      a: +m.a.toFixed(4), b: +m.b.toFixed(4), c: +m.c.toFixed(4), d: +m.d.toFixed(4),
      e: +m.e.toFixed(1), f: +m.f.toFixed(1),
    };
  };
  return {
    dome: box('#cloche-lifting-dome'), domeTf: tf('#cloche-lifting-dome'),
    cavity: box('#cloche-interior-cavity'),
    plate: box('#white-serving-plate'),
    light: box('#plate-revealed-delicacy'),
  };
});
console.log(JSON.stringify(geo, null, 1));

await p.screenshot({ path: path.join(OUT, 'persp-closeup.png'), clip: { x: 60, y: 190, width: 300, height: 130 } });
await p.screenshot({ path: path.join(OUT, 'persp-wide.png'), clip: { x: 20, y: 120, width: 350, height: 280 } });
await b.close();
