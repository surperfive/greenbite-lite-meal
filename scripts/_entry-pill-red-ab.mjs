/** 入口卡主标签「黄框 → 红框」A/B */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';
const OUT = 'scripts/_shots';
fs.mkdirSync(OUT, { recursive: true });

const VARIANTS = [
  { id: 'r0', label: '现状 金框+金字', ring: '#FDCF29', text: '#8A5F00' },
  { id: 'r1', label: '红框+红字',      ring: '#FC5294', text: '#FC5294' },
  { id: 'r2', label: '红框+黑字',      ring: '#FC5294', text: '#000000' },
  { id: 'r3', label: '红框+深红字',    ring: '#FC5294', text: '#B83C6C' },
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
  await page.waitForTimeout(1300);

  const n = await page.evaluate(({ ring, text }) => {
    const pills = [...document.querySelectorAll('span.rounded-full')]
      .filter(s => /^(HOT|FRESH|WOW|FREE)$/.test((s.textContent||'').trim()));
    for (const p of pills) {
      p.style.boxShadow = `inset 0 0 0 1px ${ring}, 0 1px 2px rgba(15,23,42,0.12)`;
      p.style.color = text;
    }
    return pills.map(p => p.textContent.trim());
  }, v);
  console.log(v.id, v.label, JSON.stringify(n));

  // 截入口卡区域（四张卡）
  const box = await page.evaluate(() => {
    const pill = [...document.querySelectorAll('span.rounded-full')].find(s => (s.textContent||'').trim()==='HOT');
    const grid = pill.closest('div.grid') || pill.closest('div').parentElement.parentElement.parentElement;
    const r = grid.getBoundingClientRect();
    return { x: Math.max(0,r.x-2), y: Math.max(0,r.y-2), width: Math.min(410-r.x+2, r.width+4), height: Math.min(900-r.y+2, r.height+4) };
  });
  await page.screenshot({ path: `${OUT}/entrypill-${v.id}.png`, clip: box });
  await page.close();
}
await browser.close();
