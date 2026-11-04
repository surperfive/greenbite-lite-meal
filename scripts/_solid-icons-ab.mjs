/** 火花「实心」两种做法 A/B：真填充 fill vs 粗描边 2.4 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';
const OUT = 'scripts/_shots';
fs.mkdirSync(OUT, { recursive: true });

const VARIANTS = [
  { id: 's0', label: '真填充 fill',       mode: 'fill' },
  { id: 's1', label: '粗描边 2.4（原状）', mode: 'stroke24' },
  { id: 's2', label: '粗描边 2.8',        mode: 'stroke28' },
];

const browser = await chromium.launch({ channel: 'chrome' });
for (const v of VARIANTS) {
  const page = await browser.newPage({ viewport: { width: 410, height: 900 }, deviceScaleFactor: 6 });
  await page.goto(BASE, { waitUntil: 'commit' });
  await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 25000 }).catch(()=>{});
  await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 25000 }).catch(()=>{});
  await page.waitForTimeout(400);
  await page.click('#nav-tab-home');
  await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(()=>{});
  await page.waitForTimeout(1300);

  const info = await page.evaluate(({ mode }) => {
    const svg = [...document.querySelectorAll('div.rounded-full.bg-black svg')]
      .find(s => (s.getAttribute('class')||'').includes('sparkles'));
    if (!svg) return null;
    if (mode === 'fill') {
      svg.style.fill = '#FC5294';
      svg.style.strokeWidth = '2';
    } else {
      svg.style.fill = 'none';
      svg.style.strokeWidth = mode === 'stroke24' ? '2.4' : '2.8';
    }
    svg.style.stroke = '#FC5294';
    const cs = getComputedStyle(svg);
    return { fill: cs.fill, sw: cs.strokeWidth };
  }, v);
  console.log(v.id, v.label, JSON.stringify(info));

  const box = await page.evaluate(() => {
    const svg = [...document.querySelectorAll('div.rounded-full.bg-black svg')]
      .find(s => (s.getAttribute('class')||'').includes('sparkles'));
    const c = svg.closest('div');
    const b = c.getBoundingClientRect();
    return { x: Math.max(0,b.x-4), y: Math.max(0,b.y-4), width: b.width+8, height: b.height+8 };
  });
  await page.screenshot({ path: `${OUT}/solid-${v.id}.png`, clip: box });
  await page.close();
}
await browser.close();
