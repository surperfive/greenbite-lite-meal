import { chromium } from 'playwright';
import { BASE } from './_base.mjs';

const b = await chromium.launch();
const errors = [];

const run = async (mode) => {
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  p.on('console', (m) => { if (m.type() === 'error') errors.push(`[${mode}] ${m.text()}`); });
  p.on('pageerror', (e) => errors.push(`[${mode}] ${String(e)}`));
  await p.goto(BASE, { waitUntil: 'networkidle' });
  await p.waitForTimeout(1500);
  await p.locator('#nav-tab-gacha').click();
  await p.waitForTimeout(1800);

  // 食材库卡片是 grid 下带 aspect-square 的直接子节点（该网格没有 id）
  const countPantry = () => p.evaluate(() =>
    document.querySelectorAll('.grid > [class*="aspect-square"]').length);
  const pantryBefore = await countPantry();

  // 记录覆盖层是否真的出现过 + 餐盖最终姿态
  await p.evaluate(() => {
    window.__seen = { overlay: false };
    const check = () => {
      if (document.querySelector('#gacha-burst-overlay')) window.__seen.overlay = true;
      requestAnimationFrame(check);
    };
    requestAnimationFrame(check);
  });

  await p.locator(mode === 'ten' ? '#btn-gacha-ten' : '#btn-gacha-single').click();
  await p.waitForTimeout(mode === 'ten' ? 7000 : 6000);

  const pantryAfter = await countPantry();
  const seen = await p.evaluate(() => window.__seen.overlay);
  const cloche = await p.evaluate(() => {
    const d = document.querySelector('#cloche-lifting-dome');
    if (!d) return null;
    const m = new DOMMatrixReadOnly(getComputedStyle(d).transform);
    return { deg: +((Math.atan2(m.b, m.a) * 180) / Math.PI).toFixed(1), x: +m.e.toFixed(1), y: +m.f.toFixed(1) };
  });

  console.log(`【${mode === 'ten' ? '十连' : '单抽'}】食材库 ${pantryBefore} → ${pantryAfter}   覆盖层出现过: ${seen ? '是' : '否'}`);
  console.log(`         餐盖终态 deg=${cloche.deg} x=${cloche.x} y=${cloche.y}  ${Math.abs(cloche.x) < 6 && Math.abs(cloche.deg) < 6 ? '✓ 已盖回' : '✗ 未盖回'}`);
  await p.close();
};

await run('single');
await run('ten');
console.log('\n控制台报错:', errors.length ? JSON.stringify(errors) : '无');
await b.close();
