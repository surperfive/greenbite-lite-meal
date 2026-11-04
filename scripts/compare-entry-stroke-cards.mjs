/**
 * 描边归一化「上线前后」对照：同一张页面，只把四张插画的 src 换回原 JPG，
 * 其余不动，两张 3× 截图上下拼起来 —— 这是唯一能证明「看起来等粗了」的图。
 *
 * 用法：node scripts/compare-entry-stroke-cards.mjs
 * 输出：outputs/entry-norm/cards-before-after.png
 */
import { chromium } from 'playwright';
import { mkdirSync, readFileSync } from 'node:fs';
import { BASE } from './_base.mjs';

const OUT = 'outputs/entry-norm';
mkdirSync(OUT, { recursive: true });
const NAMES = ['takeout', 'pickup', 'benefit', 'gacha'];

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

const gridEl = await (await page.$('#home-takeout-card')).evaluateHandle((el) => el.parentElement);
const box = await gridEl.asElement().boundingBox();

const shot = async (suffix, label) => {
  await page.evaluate(([names, sfx]) => {
    const map = { takeout: '外卖配送', pickup: '到店自取', benefit: '福利中心', gacha: '今日抽卡' };
    for (const n of names) {
      const el = [...document.querySelectorAll('img')].find((i) => i.alt === map[n]);
      if (!el) continue;
      el.src = sfx ? `/entry-${n}${sfx}` : `/entry-norm/entry-${n}.png`;
    }
  }, [NAMES, suffix]);
  // 等四张都 decode 完
  // ⚠️ 必须给 `polling`：上面把 window.requestAnimationFrame 冻成 `() => 0` 了，
  //    waitForFunction 默认就是靠 rAF 轮询的，不给 polling 会一直等到超时。
  await page.waitForFunction(
    () => [...document.querySelectorAll('#home-takeout-card, #home-pickup-card, #home-benefit-card, #home-gacha-card')]
      .flatMap((c) => [...c.querySelectorAll('img')]).every((i) => i.complete && i.naturalWidth > 0),
    null,
    { timeout: 15000, polling: 100 }
  );
  await page.waitForTimeout(250);
  const p = `${OUT}/cards-${label}.png`;
  await page.screenshot({ path: p, clip: box, timeout: 60000 });
  return p;
};

const before = await shot('.jpg', 'before');
const after = await shot('', 'after');

const b64 = (p) => `data:image/png;base64,${readFileSync(p).toString('base64')}`;
const cmp = await ctx.newPage();
await cmp.setViewportSize({ width: 1220, height: 900 });
await cmp.setContent(`<!doctype html><html><body style="margin:0;background:#0b1220;font:13px system-ui;color:#e2e8f0">
<div style="padding:14px;display:flex;flex-direction:column;gap:6px">
  <div style="color:#94a3b8">归一化前 · 渲染后描边 1.25 ~ 2.06px（离散度 1.65×）</div>
  <img id="a" style="display:block;width:1180px;border-radius:10px">
  <div style="color:#86efac;margin-top:12px">归一化后 · 渲染后描边 1.52 ~ 1.65px（离散度 1.09×）</div>
  <img id="b" style="display:block;width:1180px;border-radius:10px">
</div></body></html>`);
await cmp.evaluate(([a, b]) => {
  document.getElementById('a').src = a;
  document.getElementById('b').src = b;
}, [b64(before), b64(after)]);
await cmp.waitForTimeout(700);
await cmp.screenshot({ path: `${OUT}/cards-before-after.png`, fullPage: true });
console.log(`输出：${OUT}/cards-before-after.png`);
await browser.close();
