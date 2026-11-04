import { chromium } from 'playwright';
import path from 'node:path';
const file = 'file:///' + path.resolve('scripts/_bubble-white-ab.html').replace(/\\/g, '/');
const b = await chromium.launch({ channel: 'chrome' });
const p = await b.newPage({ viewport: { width: 900, height: 1340 }, deviceScaleFactor: 3 });
await p.goto(file, { waitUntil: 'load' });
await p.waitForTimeout(400);
await p.screenshot({ path: 'scripts/_shots/white-ab.png', fullPage: true });
const S = 620 / 195;
const pos = await p.evaluate(() => [...document.querySelectorAll('svg')].map(s => {
  const r = s.getBoundingClientRect(); return { x: r.x, y: r.y };
}));
let i = 0;
for (const o of pos) {
  await p.screenshot({ path: `scripts/_shots/wz-${'1234'[i++]}.png`,
    clip: { x: o.x + (655 - 615) * S, y: o.y + (58 - 4) * S, width: 60 * S, height: 36 * S } });
}
await b.close(); console.log('ok');
