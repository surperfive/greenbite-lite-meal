import { chromium } from 'playwright';
import path from 'node:path';
const file = 'file:///' + path.resolve('scripts/_crown-ab.html').replace(/\\/g, '/');
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 560, height: 760 }, deviceScaleFactor: 4 });
await page.goto(file, { waitUntil: 'load' });
await page.waitForTimeout(400);
const boxes = await page.evaluate(() =>
  [...document.querySelectorAll('.row svg')].map(s => {
    const b = s.getBoundingClientRect();
    return { x: b.x, y: b.y, w: b.width, h: b.height };
  })
);
let i = 0;
for (const b of boxes) {
  await page.screenshot({ path: `scripts/_shots/ab-${'ABCD'[i++]}.png`, clip: { x: b.x + 6, y: b.y + 10, width: b.w - 12, height: b.h - 20 } });
}
console.log(JSON.stringify(boxes));
await browser.close();
