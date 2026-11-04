/** 两个区块头图标「空心化」A/B：火焰去 fill、火花调细 stroke */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';
const OUT = 'scripts/_shots';
fs.mkdirSync(OUT, { recursive: true });

const VARIANTS = [
  { id: 'v0', label: '现状 火焰实心 / 火花2.4', flameFill: true,  flameSW: 2,   sparkSW: 2.4 },
  { id: 'v1', label: '火焰空心2 / 火花2.0',      flameFill: false, flameSW: 2,   sparkSW: 2.0 },
  { id: 'v2', label: '火焰空心2.3 / 火花1.9',    flameFill: false, flameSW: 2.3, sparkSW: 1.9 },
  { id: 'v3', label: '火焰空心2.6 / 火花1.7',    flameFill: false, flameSW: 2.6, sparkSW: 1.7 },
];

const browser = await chromium.launch({ channel: 'chrome' });
for (const v of VARIANTS) {
  const page = await browser.newPage({ viewport: { width: 410, height: 900 }, deviceScaleFactor: 4 });
  await page.goto(BASE, { waitUntil: 'commit' });
  await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 25000 }).catch(()=>{});
  await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 25000 }).catch(()=>{});
  await page.waitForTimeout(400);
  await page.click('#nav-tab-home');
  await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(()=>{});
  await page.waitForTimeout(1200);

  const found = await page.evaluate(({ flameFill, flameSW, sparkSW }) => {
    const all = [...document.querySelectorAll('div.rounded-full.bg-black')];
    const res = [];
    for (const c of all) {
      const svg = c.querySelector('svg');
      if (!svg) continue;
      const box = c.getBoundingClientRect();
      if (box.width > 40) continue;                 // 只要 24px 小圆
      const cls = svg.getAttribute('class') || '';
      const isFlame = cls.includes('fill-');
      if (isFlame) {
        svg.style.fill = flameFill ? '#FC5294' : 'none';
        svg.setAttribute('stroke-width', String(flameSW));
      } else {
        svg.style.fill = 'none';
        svg.setAttribute('stroke-width', String(sparkSW));
      }
      svg.style.stroke = '#FC5294';
      res.push({ kind: isFlame ? 'flame' : 'spark', w: +box.width.toFixed(1), cls: cls.slice(0,40) });
    }
    return res;
  }, v);
  console.log(v.id, v.label, JSON.stringify(found));

  const boxes = await page.evaluate(() => {
    const out = [];
    for (const c of document.querySelectorAll('div.rounded-full.bg-black')) {
      const r = c.getBoundingClientRect();
      if (r.width > 40) continue;
      out.push({ x: Math.max(0, r.x - 6), y: Math.max(0, r.y - 6), width: 200, height: r.height + 12 });
    }
    return out;
  });
  for (let i = 0; i < boxes.length; i++) {
    await page.screenshot({ path: `${OUT}/hollow-${v.id}-${i}.png`, clip: boxes[i] });
  }
  await page.close();
}
await browser.close();
