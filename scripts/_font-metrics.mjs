/**
 * 精确推导「墨迹中心相对行盒中心」的偏移（单位 em）。
 *
 * 用 200px 量字体度量，把 canvas fontBoundingBox* 的整数舍入误差摊薄到 0.0025em。
 *   offset_em = (A − D)/2 + (inkDesc − inkAsc)/2      与 line-height 无关
 * 同时给出「表意字框（国）」与「纯拉丁（H）」两组，因为两者视觉重心不同。
 */
import { chromium } from 'playwright';
import { BASE } from './_base.mjs';

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 } });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });

const res = await page.evaluate(() => {
  const el = document.querySelector('[data-dish-thumb="true"]');
  const cs = getComputedStyle(el);
  const stack = cs.fontFamily;

  const cv = document.createElement('canvas');
  const ctx = cv.getContext('2d');
  const SZ = 200;

  const probe = (text, weight) => {
    ctx.font = `${weight} ${SZ}px ${stack}`;
    const m = ctx.measureText(text);
    return {
      A: m.fontBoundingBoxAscent,
      D: m.fontBoundingBoxDescent,
      inkA: m.actualBoundingBoxAscent,
      inkD: m.actualBoundingBoxDescent,
    };
  };

  const off = (r) => ((r.A - r.D) / 2 + (r.inkD - r.inkA) / 2) / SZ;

  const out = { stack, SZ, samples: {} };
  for (const [name, text, w] of [
    ['国(常规)', '国', 400],
    ['国(黑体)', '国', 900],
    ['全部(黑体)', '全部', 900],
    ['自提(黑体)', '自提', 900],
    ['H(黑体)', 'H', 900],
    ['LV.2(黑体)', 'LV.2', 900],
  ]) {
    const r = probe(text, w);
    out.samples[name] = {
      A: +(r.A / SZ).toFixed(4),
      D: +(r.D / SZ).toFixed(4),
      inkA: +(r.inkA / SZ).toFixed(4),
      inkD: +(r.inkD / SZ).toFixed(4),
      offEm: +off(r).toFixed(4),
      offPx12: +(off(r) * 12).toFixed(2),
      offPx9: +(off(r) * 9).toFixed(2),
    };
  }
  return out;
});

console.log('font-family:', res.stack);
console.log('度量基准:', res.SZ, 'px\n');
console.log('样本'.padEnd(14), 'A'.padStart(8), 'D'.padStart(8), 'inkA'.padStart(8), 'inkD'.padStart(8), 'offEm'.padStart(9), '12px'.padStart(7), '9px'.padStart(7));
for (const [k, v] of Object.entries(res.samples)) {
  console.log(
    k.padEnd(14),
    String(v.A).padStart(8), String(v.D).padStart(8),
    String(v.inkA).padStart(8), String(v.inkD).padStart(8),
    String(v.offEm).padStart(9), String(v.offPx12).padStart(7), String(v.offPx9).padStart(7),
  );
}
await browser.close();
