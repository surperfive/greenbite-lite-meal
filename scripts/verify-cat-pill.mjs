/**
 * 验证抽卡页「全部/蛋白/蔬底」分类切换的滑块位移动画。
 * · 采样切换后连续帧的指示块 x 坐标，确认是「滑过去」而不是「瞬移」
 * · 截 tab 条特写（前 / 中 / 后）
 * 用法：node scripts/verify-cat-pill.mjs
 */
import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
import fs from 'node:fs';

const OUT = 'outputs/cat-pill';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 3 });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));

await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.click('#nav-tab-gacha');
await page.waitForSelector('#unified-pantry-big-card', { timeout: 20000 });
await page.waitForTimeout(900);

await page.evaluate(() => {
  document.querySelector('#unified-pantry-big-card')?.scrollIntoView({ block: 'center' });
});
await page.waitForTimeout(500);

// tab 条容器（含三个按钮）
const track = await page.evaluateHandle(() => {
  const card = document.querySelector('#unified-pantry-big-card');
  const btns = [...card.querySelectorAll('button')].filter((b) => ['全部', '蛋白', '蔬底'].includes(b.textContent.trim()));
  return btns[0]?.parentElement ?? null;
});
const trackEl = track.asElement();
const clip = async (name) => {
  const b = await trackEl.boundingBox();
  await page.screenshot({
    path: `${OUT}/${name}.png`,
    clip: { x: b.x - 4, y: b.y - 4, width: b.width + 8, height: b.height + 8 },
  });
};
// 等页面进场动画（gacha 页有一层淡入覆盖）彻底结束，否则截出来整片发白
await page.waitForTimeout(1500);
await clip('tab-0-all');

const pillBox = () =>
  page.evaluate(() => {
    const card = document.querySelector('#unified-pantry-big-card');
    const pill = [...card.querySelectorAll('span')].find(
      (s) => s.className.includes('bg-black') && s.className.includes('rounded-full') && s.className.includes('absolute')
    );
    if (!pill) return null;
    const r = pill.getBoundingClientRect();
    return { x: +r.x.toFixed(2), w: +r.width.toFixed(2) };
  });

const click = (label) =>
  page.evaluate((l) => {
    const card = document.querySelector('#unified-pantry-big-card');
    const b = [...card.querySelectorAll('button')].find((x) => x.textContent.trim() === l);
    b?.click();
  }, label);

console.log('初始（全部）', await pillBox());

// 全部 → 蛋白
await click('蛋白');
await page.waitForTimeout(55);
await clip('tab-1-mid');
await page.waitForTimeout(400);
console.log('落到蛋白', await pillBox());
await clip('tab-2-protein');

// 蛋白 → 蔬底：逐帧采样
const frames = page.evaluate(async () => {
  const card = document.querySelector('#unified-pantry-big-card');
  const getPill = () =>
    [...card.querySelectorAll('span')].find(
      (s) => s.className.includes('bg-black') && s.className.includes('rounded-full') && s.className.includes('absolute')
    );
  const samples = [];
  const t0 = performance.now();
  return await new Promise((resolve) => {
    const tick = () => {
      const p = getPill();
      if (p) {
        const r = p.getBoundingClientRect();
        samples.push({ t: +(performance.now() - t0).toFixed(0), x: +r.x.toFixed(2), w: +r.width.toFixed(2) });
      }
      if (performance.now() - t0 > 420) resolve(samples);
      else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
});
await click('蔬底');
const samples = await frames;
console.log('蛋白 → 蔬底 逐帧 x：');
console.log(samples.map((s) => `${s.t}ms:${s.x}`).join('  '));
const xs = samples.map((s) => s.x);
const uniq = new Set(xs);
console.log('不同 x 值的帧数 =', uniq.size, '/', xs.length, '→', uniq.size >= 3 ? '有中间态（位移）' : '疑似瞬移');

await page.waitForTimeout(500);
await clip('tab-3-base');
console.log('落到蔬底', await pillBox());

await browser.close();
