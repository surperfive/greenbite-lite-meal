/** 验证：两个区块头图标已是空心，并确认其它地方的实心火焰未受影响 */
import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 410, height: 900 }, deviceScaleFactor: 4 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 25000 }).catch(()=>{});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 25000 }).catch(()=>{});
await page.waitForTimeout(400);
await page.click('#nav-tab-home');
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(()=>{});
await page.waitForTimeout(1200);

const r = await page.evaluate(() => {
  const out = [];
  for (const c of document.querySelectorAll('div.rounded-full.bg-black')) {
    const svg = c.querySelector('svg');
    if (!svg) continue;
    const b = c.getBoundingClientRect();
    if (b.width > 40) continue;
    const cs = getComputedStyle(svg);
    out.push({
      icon: (svg.getAttribute('class')||'').match(/lucide-(\w+)/)?.[1],
      fill: cs.fill,
      stroke: cs.stroke,
      strokeWidth: cs.strokeWidth,
      box: `${b.width}x${b.height}`,
    });
  }
  return out;
});
console.log(JSON.stringify(r, null, 2));

const boxes = await page.evaluate(() => {
  const out = [];
  for (const c of document.querySelectorAll('div.rounded-full.bg-black')) {
    const b = c.getBoundingClientRect();
    if (b.width > 40) continue;
    out.push({ x: Math.max(0, b.x - 6), y: Math.max(0, b.y - 6), width: 200, height: b.height + 12 });
  }
  return out;
});
for (let i=0;i<boxes.length;i++) await page.screenshot({ path: `scripts/_shots/hollow-final-${i}.png`, clip: boxes[i] });
await browser.close();
