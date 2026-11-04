import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 4 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#nav-tab-home', { timeout: 20000 });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(2200);
await page.click('#nav-tab-home');
await page.waitForTimeout(1200);
await page.click('#home-benefit-card');
await page.waitForTimeout(1600);
const boxes = await page.evaluate(() =>
  Array.from(document.querySelectorAll('.wf-icon-box')).map((el) => {
    const r = el.getBoundingClientRect();
    return { x: r.left - 6, y: r.top - 6, width: r.width + 12, height: r.height + 12 };
  })
);
for (let i = 0; i < boxes.length; i++) {
  await page.screenshot({ path: `scripts/_shots/wf-ic${i + 1}.png`, clip: boxes[i] });
}
console.log(JSON.stringify(boxes));
await browser.close();
