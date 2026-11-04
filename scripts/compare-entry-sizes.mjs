/**
 * 插画尺寸三档对照：同一个页面里临时改容器尺寸，各截一张四宫格，拼成一张。
 * 用法：node scripts/compare-entry-sizes.mjs 80 70 62
 */
import { chromium } from 'playwright';
import { mkdirSync, readFileSync } from 'node:fs';
import { BASE } from './_base.mjs';

const sizes = (process.argv.slice(2).length ? process.argv.slice(2) : ['80', '70', '62']).map(Number);
const OUT = 'outputs/entry-compare';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 3 });
await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
const page = await ctx.newPage();

await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#nav-tab-home', { timeout: 60000 });
await page.waitForTimeout(600);
await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((x) => x.textContent?.trim() === '跳过');
  b?.click();
});
await page.waitForTimeout(900);
await page.click('#nav-tab-home');
await page.waitForTimeout(1200);
await page.evaluate(() => { window.requestAnimationFrame = () => 0; });
await page.waitForTimeout(150);

const box = await page.evaluate(() => {
  const el = document.querySelector('#home-takeout-card')?.parentElement;
  const r = el.getBoundingClientRect();
  return { x: r.x, y: r.y, width: r.width, height: r.height };
});

const shots = [];
for (const h of sizes) {
  const w = Math.round(h * 1.5); // 外卖素材整体比例 1.5，保持「高度受限」不被宽度绑死
  await page.evaluate(
    ([h, w]) => {
      for (const card of ['takeout', 'pickup', 'benefit', 'gacha']) {
        const img = document.querySelector(`#home-${card}-card img`);
        const wrap = img?.parentElement;
        if (!wrap) continue;
        wrap.style.height = h + 'px';
        wrap.style.width = w + 'px';
      }
    },
    [h, w]
  );
  await page.waitForTimeout(250);
  const p = `${OUT}/size-${h}.png`;
  await page.screenshot({ path: p, clip: box, timeout: 60000 });
  shots.push([p, `${h}px`]);
  console.log('captured', h);
}

// 竖向拼一张
const cmp = await ctx.newPage();
await cmp.setViewportSize({ width: 1400, height: 1000 });
const imgs = shots
  .map(
    ([p, label]) =>
      `<figure style="margin:0"><figcaption style="color:#e2e8f0;font:13px system-ui;padding:5px 8px">容器高 ${label}</figcaption><img src="data:image/png;base64,${readFileSync(p).toString('base64')}" style="width:660px;display:block"></figure>`
  )
  .join('');
await cmp.setContent(
  `<!doctype html><html><body style="margin:0;background:#0b1220"><div style="display:flex;gap:8px;padding:8px;align-items:flex-start">${imgs}</div></body></html>`
);
await cmp.waitForTimeout(400);
await cmp.screenshot({ path: `${OUT}/size-compare.png`, fullPage: true });
console.log(`输出：${OUT}/size-compare.png`);
await browser.close();
