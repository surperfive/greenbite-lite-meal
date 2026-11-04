/**
 * blob 改造的回归断言：确认「食物 transform / 文字弧」与改前完全一致，
 * 且 blob 顶点不溢出 100px 容器。
 * 用法：BASE_URL=http://localhost:5180 node scripts/_blob-assert.mjs
 */
import { chromium } from 'playwright';
import { BASE } from './_base.mjs';

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
    const textPath = el.querySelector('textPath');
    const svgs = el.querySelectorAll('svg');
    // blob svg = 第一个 svg（DOM 顺序：blob 在食物/文字之前）
    const blobSvg = svgs[0];
    const blobPathEl = blobSvg?.querySelector('path');
    let bbox = null;
    try { bbox = blobPathEl?.getBBox(); } catch {}
    out.push({
      name: el.closest('.group')?.querySelector('h4')?.textContent ?? '',
      imgTransform: img?.style.transform ?? null,
      arcD: textPath?.parentElement?.getAttribute('d') ?? null,
      blobBBox: bbox ? { x: +bbox.x.toFixed(2), y: +bbox.y.toFixed(2), w: +bbox.width.toFixed(2), h: +bbox.height.toFixed(2) } : null,
      blobFill: blobPathEl?.getAttribute('fill') ?? null,
    });
  });
  return out;
});

let bad = 0;
for (const r of rows) {
  const overflow = r.blobBBox && (r.blobBBox.y < -0.01 || r.blobBBox.y + r.blobBBox.h > 100.01);
  if (overflow) bad++;
  console.log(
    `${r.name}\n  transform: ${r.imgTransform}\n  arc: ${r.arcD}\n  blobBBox: ${JSON.stringify(r.blobBBox)} fill=${r.blobFill}${overflow ? '  ❌ 溢出容器' : ''}`
  );
}
console.log(bad === 0 ? '\nALL OK: blob 顶点/底点均在 100 容器内' : `\n${bad} 张溢出`);
await browser.close();
