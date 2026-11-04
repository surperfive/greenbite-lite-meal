/**
 * blob 底盘验证：点餐页所有菜品卡的封面截图 + 关键几何测量。
 * 用法：BASE_URL=http://localhost:5180 node scripts/_blob-shot.mjs
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';

const OUT = 'scripts/_shots';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 3 });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.log('[console.error]', m.text()); });

await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.waitForTimeout(800);

const n = await page.locator('[data-dish-thumb="true"]').count();
console.log('dish thumbs:', n);

// 逐卡滚动到视口中部再截（贴边元素 locator.screenshot 有裁剪伪影）
for (let i = 0; i < n; i++) {
  const t = page.locator('[data-dish-thumb="true"]').nth(i);
  await t.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(250);
  await t.screenshot({ path: `${OUT}/blob-card-${i}.png` });
}

// 几何：blob svg 的存在性 + 与弧文字 svg 的层序 + 每卡的 transform 一致性
const geo = await page.evaluate(() => {
  const out = [];
  document.querySelectorAll('[data-dish-thumb="true"]').forEach((el, i) => {
    const svgs = el.querySelectorAll('svg');
    const img = el.querySelector('img');
    out.push({
      i,
      svgCount: svgs.length,
      imgZ: img ? getComputedStyle(img).zIndex : null,
      firstSvgPath: svgs[0]?.querySelector('path')?.getAttribute('d')?.slice(0, 40) ?? null,
      hasTextPath: !!el.querySelector('textPath'),
    });
  });
  return out;
});
console.log('GEO', JSON.stringify(geo, null, 2));

await page.screenshot({ path: `${OUT}/blob-menu-page.png` });
await browser.close();
