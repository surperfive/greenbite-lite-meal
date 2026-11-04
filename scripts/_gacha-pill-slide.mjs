/** 「全部/蛋白/蔬底」滑块动画录帧：点「蔬底」后每 33ms 抓一张，拼成帧序列看是否真滑动。 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';
fs.mkdirSync('scripts/_shots', { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));

await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#nav-tab-gacha', { timeout: 20000 });
await page.waitForTimeout(600);
await page.click('#nav-tab-gacha');
await page.waitForSelector('#unified-pantry-big-card', { timeout: 15000 });
await page.waitForTimeout(1200);

const track = await page.locator('#unified-pantry-big-card div.relative.inline-flex').first();
const tb = await track.boundingBox();
console.log('track box', tb);

const clip = { x: Math.max(0, tb.x - 6), y: Math.max(0, tb.y - 6), width: tb.width + 12, height: tb.height + 12 };

// 记录滑块 left/width 轨迹
const frames = [];
await page.evaluate(() => {
  window.__pillLog = [];
  const t0 = performance.now();
  const tick = () => {
    const pill = document.querySelector('[data-pill-track] span, [data-pill-track] > span');
    const el = document.querySelector('#unified-pantry-big-card div.relative.inline-flex');
    const slider = el?.querySelector('span.pointer-events-none.absolute');
    if (slider) {
      const r = slider.getBoundingClientRect();
      const pr = el.getBoundingClientRect();
      window.__pillLog.push({ t: +(performance.now() - t0).toFixed(0), left: +(r.left - pr.left).toFixed(1), w: +r.width.toFixed(1) });
    }
    if (performance.now() - t0 < 700) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
});

// 依次点 蔬底 -> 全部，各抓 6 帧
const btn = (label) => page.locator('#unified-pantry-big-card button').filter({ hasText: label }).first();
await btn('蔬底').click();
for (let i = 0; i < 8; i++) {
  await page.screenshot({ path: `scripts/_shots/pill-f${String(i).padStart(2, '0')}.png`, clip });
  await page.waitForTimeout(33);
}
await page.waitForTimeout(600);
await page.screenshot({ path: 'scripts/_shots/pill-f-end.png', clip });

const log = await page.evaluate(() => window.__pillLog);
console.log('滑块轨迹（前 24 帧）:');
console.log(log.slice(0, 24).map((l) => `${l.t}ms left=${l.left} w=${l.w}`).join('\n'));

// 终态位置
const geo = await page.evaluate(() => {
  const el = document.querySelector('#unified-pantry-big-card div.relative.inline-flex');
  const slider = el?.querySelector('span.pointer-events-none.absolute');
  const btns = [...el.querySelectorAll('button')].map((b) => {
    const r = b.getBoundingClientRect();
    return { label: b.textContent.trim(), x: +(r.left - el.getBoundingClientRect().left).toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) };
  });
  const r = slider?.getBoundingClientRect();
  return { slider: r ? { x: +(r.left - el.getBoundingClientRect().left).toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) } : null, btns };
});
console.log('终态', JSON.stringify(geo, null, 2));
await browser.close();
