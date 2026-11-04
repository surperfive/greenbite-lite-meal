import { chromium } from 'playwright';
import path from 'node:path';
const file = 'file:///' + path.resolve('scripts/_bubble-ab.html').replace(/\\/g, '/');
const b = await chromium.launch({ channel: 'chrome' });
const p = await b.newPage({ viewport: { width: 860, height: 1320 }, deviceScaleFactor: 6 });
await p.goto(file, { waitUntil: 'load' });
await p.waitForTimeout(400);
// 每个 svg 的尾巴区域：viewBox 610,4 200x100 → 宽 600 高 300，scale=3
// 尾巴在用户坐标 x 650~730 / y 60~92
const idx = await p.evaluate(() => [...document.querySelectorAll('svg')].map(s => {
  const r = s.getBoundingClientRect(); return { x: r.x, y: r.y };
}));
const S = 3;
let i = 0;
for (const o of idx) {
  await p.screenshot({
    path: `scripts/_shots/tail-${'ABCD'[i++]}.png`,
    clip: { x: o.x + (648 - 610) * S, y: o.y + (58 - 4) * S, width: 90 * S, height: 36 * S },
  });
}
await b.close();
console.log('ok');
