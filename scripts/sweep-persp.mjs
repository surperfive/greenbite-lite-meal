import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
import fs from 'node:fs'; import path from 'node:path';

const OUT = 'probe-out/persp'; fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });

/* 刚性方案扫描：只允许 translate + rotate（都是刚体变换，形状不变），
   禁用 scale / skew —— 错切虽然投影正确，但会让穹顶轮廓明显被压扁，属于形变。
   支点仍是穹顶底缘左端点 (78, 216)。
   写法 `translateY(a) rotate(b)` = 先绕支点转，再整体抬起。 */
const rigid = (deg, lift) => `translateY(${lift}px) rotate(${deg}deg)`;

const VARIANTS = [
  ['A-纯抬起26不转', rigid(0, -26)],
  ['B-抬起22+转5', rigid(-5, -22)],
  ['C-抬起18+转8', rigid(-8, -18)],
  ['D-纯转10不抬', rigid(-10, 0)],
  ['E-抬起30+转4', rigid(-4, -30)],
  ['F-抬起14+转12', rigid(-12, -14)],
];

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
await p.waitForTimeout(1100);
await p.evaluate(() => { window.__frozen = true; });
await p.waitForTimeout(150);

let i = 1;
for (const [label, tf] of VARIANTS) {
  await p.evaluate((t) => {
    const el = document.querySelector('#cloche-lifting-dome');
    el.style.transformBox = 'view-box';
    el.style.transformOrigin = '78px 216px';
    el.style.transform = t;
  }, tf);
  await p.waitForTimeout(120);
  await p.screenshot({ path: path.join(OUT, `v${String(i).padStart(2, '0')}.png`), clip: { x: 40, y: 100, width: 340, height: 250 } });
  console.log(`v${i}  ${label}  <- ${tf}`);
  i++;
}
await b.close();
