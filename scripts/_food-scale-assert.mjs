/**
 * 「扩大食材」回归断言：从真实 DOM 读 img 的 transform，结合抠图 alpha bbox
 * 反推食物内容的渲染四边，检查四条边界：
 *   left ≥ −9.5 / top ≥ −9.5   （卡片 p-2.5 = 10px 内边距缓冲）
 *   bottom ≤ 84                （再往下会被右下黑框吃掉太多）
 *   right ≤ 盘右缘 − 9         （月牙至少留 9，否则色块像"被撑满"）
 * 用法：BASE_URL=http://localhost:5180 node scripts/_food-scale-assert.mjs
 */
import { chromium } from 'playwright';
import { BASE } from './_base.mjs';

// 抠图内容 bbox（`split()[3].getbbox()` 实测，与 DishCoverArt 的注释同源）
const BB = {
  1: { x0: 4.1, y0: 14.1, x1: 96.2, y1: 85.3, name: '牛油果鸡胸沙拉' },
  3: { x0: 17.5, y0: 0.6, x1: 82.2, y1: 95.6, name: '羽衣甘蓝酸奶昔' },
  4: { x0: 3.8, y0: 21.6, x1: 96.2, y1: 78.8, name: '金枪鱼三明治' },
  7: { x0: 3.8, y0: 14.7, x1: 96.2, y1: 85.0, name: '日式照烧鸡肉锅' },
  8: { x0: 12.8, y0: 3.8, x1: 87.5, y1: 96.2, name: '冷萃燕麦拿铁' },
  9: { x0: 3.8, y0: 6.6, x1: 96.2, y1: 93.4, name: '希腊酸奶杯' },
};
// 每道菜的盘 inset（inset 4 → 盘右缘 96；inset 7 → 93）
const INSET = { 1: 4, 3: 7, 4: 4, 7: 4, 8: 7, 9: 4 };
// 「落点」= 底部 25% 高度内的 alpha 质心（相对 320 画布的百分比）。
// ⚠️ 这才是"食物坐在哪"的真值；bbox 中心会被朝右上的勺柄/把手污染（差 3.8~5.4）。
const FLOOR = { 1: 49.41, 3: 44.38, 4: 48.87, 7: 50.13, 8: 49.61, 9: 46.20 };
// 2026-10-25 用户要求右移 2 的三张（奶昔/照烧/酸奶）落点 43.5，另三张 41.5
// ⚠️ 奶昔单独 46.5（第 52 轮再 +3）：窄高杯的落点质心天然偏左，按 43.5 对齐后
//    色块内仍是「左留 9.6 / 右留 15.4」明显偏左，用户再次要求右移。
//    这条是**逐菜基准**，不是"没对齐"，别顺手拉回 43.5。
const FLOOR_TARGET = { 1: 41.5, 4: 41.5, 8: 41.5, 7: 43.5, 9: 43.5, 3: 46.5 };

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));

await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.waitForTimeout(900);

const rows = await page.evaluate(() => {
  const out = [];
  document.querySelectorAll('[data-dish-thumb="true"]').forEach((el) => {
    const img = el.querySelector('img');
    out.push({
      name: el.closest('.group')?.querySelector('h4')?.textContent?.trim() ?? '',
      transform: img?.style.transform ?? '',
    });
  });
  return out;
});

// 月牙下限 8.5：2026-10-25 用户要求奶昔/照烧/酸奶右移 2 后，酸奶落到 8.54
// （六张最薄）。原来定 9，放宽 0.5 是这次右移的代价，别再往下放。
//
// ⚠️ 本脚本**不检查面积**。第 45 轮曾把六张内容盒面积统一到 ≈5000，
//    但 2026-10-25 晚用户点名「扩大一点酸奶杯和照烧鸡肉锅」，
//    照烧 4998→5716、酸奶 5007→5733（各 +14.4%），**这是刻意的例外，不是回归**。
//    其余四张仍是 4973~5007。改构图时别看到这两个数就"顺手"缩回去。
const LIMIT = { min: -9.5, bottom: 84, crescent: 8.5, floorTol: 0.4 };
let bad = 0;

for (const r of rows) {
  const m = /translate\(([-\d.]+)%,\s*([-\d.]+)%\)\s*scale\(([-\d.]+)\)/.exec(r.transform);
  if (!m) {
    console.log(`❌ 解析失败: ${r.name} transform=${r.transform}`);
    bad++;
    continue;
  }
  const dx = +m[1];
  const dy = +m[2];
  const s = +m[3];
  // 按名字找 id（顺序稳定，但用名字更稳）
  const id = Object.keys(BB).find((k) => BB[k].name === r.name);
  if (!id) {
    console.log(`⚠️ 未收录的菜: ${r.name}`);
    continue;
  }
  const b = BB[id];
  const left = 50 + (b.x0 - 50) * s + dx;
  const top = 50 + (b.y0 - 50) * s + dy;
  const right = 50 + (b.x1 - 50) * s + dx;
  const bottom = 50 + (b.y1 - 50) * s + dy;
  const discRight = 100 - INSET[id];
  const crescent = discRight - right;
  // 落点中心：所有菜必须落在同一条竖线上（FLOOR_X ± 0.4）
  const floorCx = 50 + (FLOOR[id] - 50) * s + dx;

  const errs = [];
  if (left < LIMIT.min) errs.push(`left ${left.toFixed(2)} < ${LIMIT.min}`);
  if (top < LIMIT.min) errs.push(`top ${top.toFixed(2)} < ${LIMIT.min}`);
  if (bottom > LIMIT.bottom) errs.push(`bottom ${bottom.toFixed(2)} > ${LIMIT.bottom}`);
  if (crescent < LIMIT.crescent) errs.push(`月牙 ${crescent.toFixed(2)} < ${LIMIT.crescent}`);
  const target = FLOOR_TARGET[+id];
  if (Math.abs(floorCx - target) > LIMIT.floorTol)
    errs.push(`落点 ${floorCx.toFixed(2)} 偏离 ${target}`);
  if (errs.length) bad++;

  console.log(
    `${r.name.padEnd(7, '　')} s=${s.toFixed(3)} ` +
      `盒 ${(right - left).toFixed(1)}×${(bottom - top).toFixed(1)}  ` +
      `l=${left.toFixed(2)} t=${top.toFixed(2)} r=${right.toFixed(2)} b=${bottom.toFixed(2)}  ` +
      `月牙=${crescent.toFixed(2)} 落点=${floorCx.toFixed(2)}` +
      (errs.length ? `  ❌ ${errs.join(' / ')}` : '')
  );
}

console.log(bad === 0 ? '\nALL OK：四边安全 + 六道菜落点都在同一条竖线上' : `\n${bad} 张不合格`);
await browser.close();
