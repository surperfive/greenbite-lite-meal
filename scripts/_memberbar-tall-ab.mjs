/** 身份条「调高」四档 A/B：现状 36 / 只加内边距 40 / 内容+内边距 40 / 内容+内边距 44 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';
const OUT = 'scripts/_shots';
fs.mkdirSync(OUT, { recursive: true });

const VARIANTS = [
  { id: 'A', label: '现状 36（头像28/py3/r18/mt18）', av: 28, py: 3, r: 18, mt: 18 },
  { id: 'B', label: '40 只加内边距（头像28/py5/r20/mt20）', av: 28, py: 5, r: 20, mt: 20 },
  { id: 'C', label: '40 内容+内边距（头像32/py3/r20/mt20）', av: 32, py: 3, r: 20, mt: 20 },
  { id: 'D', label: '44 内容+内边距（头像32/py5/r22/mt22）', av: 32, py: 5, r: 22, mt: 22 },
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
  await page.waitForTimeout(1600);

  await page.evaluate(({ av, py, r, mt }) => {
    const bar = document.getElementById('home-member-bar');
    if (!bar) return null;
    bar.style.minHeight = '0px';
    bar.style.paddingTop = py + 'px';
    bar.style.paddingBottom = py + 'px';
    bar.style.borderRadius = r + 'px';
    const img = bar.querySelector('img');
    if (img) { img.style.height = av + 'px'; img.style.width = av + 'px'; }
    const anon = bar.querySelector('span.flex.h-\\[30px\\]');
    if (anon) { anon.style.height = (av + 2) + 'px'; anon.style.width = (av + 2) + 'px'; }
    // 骑缝：-mt 挂在按钮的爷爷 div 上
    let wrap = bar.parentElement;
    while (wrap && !(wrap.className || '').toString().includes('-mt-')) wrap = wrap.parentElement;
    if (wrap) wrap.style.marginTop = '-' + mt + 'px';
    return true;
  }, v);
  await page.waitForTimeout(450);   // ⚠️ transition-all 200ms：不等等读到的是过渡起点
  const m = await page.evaluate(() => {
    const bar = document.getElementById('home-member-bar');
    const inner = bar.querySelector('span.relative');
    const cs = getComputedStyle(bar);
    return {
      h: +bar.getBoundingClientRect().height.toFixed(2),
      avatarBox: inner ? +inner.getBoundingClientRect().height.toFixed(2) : null,
      pt: cs.paddingTop, minH: cs.minHeight, r: cs.borderRadius,
    };
  });
  console.log(v.id, v.label, JSON.stringify(m));

  const box = await page.evaluate(() => {
    const bar = document.getElementById('home-member-bar');
    const b = bar.getBoundingClientRect();
    return { x: Math.max(0, b.x - 12), y: Math.max(0, b.y - 22), width: Math.min(410 - b.x + 12, b.width + 24), height: b.height + 44 };
  });
  await page.screenshot({ path: `${OUT}/mbar-${v.id}.png`, clip: box });
  await page.close();
}
await browser.close();
