import { chromium } from 'playwright';
import path from 'node:path';
const file = 'file:///' + path.resolve('scripts/_bubble-tail-ab.html').replace(/\\/g, '/');
const b = await chromium.launch({ channel: 'chrome' });
const p = await b.newPage({ viewport: { width: 900, height: 1340 }, deviceScaleFactor: 7 });
await p.goto(file, { waitUntil: 'load' });
await p.waitForTimeout(400);
const pos = await p.evaluate(() => [...document.querySelectorAll('svg')].map(s => {
  const r = s.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height };
}));
// viewBox 615,4 195x96 → 宽 620 ⇒ scale = 620/195 = 3.1795
const S = 620 / 195;
let i = 0;
for (const o of pos) {
  await p.screenshot({
    path: `scripts/_shots/tz-${'1234'[i++]}.png`,
    clip: { x: o.x + (650 - 615) * S, y: o.y + (60 - 4) * S, width: 62 * S, height: 34 * S },
  });
}
await b.close(); console.log('ok');
