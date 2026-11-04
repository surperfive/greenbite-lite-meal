/**
 * 验证描边归一化结果：原图 vs 归一化图。
 *
 * 上半：同高（320px）并排，看「同一高度下是否一样粗」——这是归一化的目标。
 * 下半：按真实卡片尺寸（62/62/72/72 + object-contain）渲染，DSF=4 放大，看真实观感。
 *
 * 用法：node scripts/verify-entry-norm.mjs
 * 输出：outputs/entry-norm/compare-norm.png、real-size.png
 */
import { chromium } from 'playwright';
import { readFileSync, mkdirSync } from 'node:fs';

const JOBS = [
  { file: 'entry-takeout', label: '外卖配送', h: 62, w: 94 },
  { file: 'entry-pickup', label: '到店自取', h: 62, w: 94 },
  { file: 'entry-benefit', label: '福利中心', h: 72, w: 100 },
  { file: 'entry-gacha', label: '今日抽卡', h: 72, w: 100 },
];
const OUT = 'outputs/entry-norm';
mkdirSync(OUT, { recursive: true });

const b64 = (p) => `data:image/${p.endsWith('.png') ? 'png' : 'jpeg'};base64,${readFileSync(p).toString('base64')}`;

const browser = await chromium.launch({ channel: 'chrome' });

// ── 1) 同高并排对照 ───────────────────────────────────────────
{
  const page = await browser.newPage({ viewport: { width: 1500, height: 780 }, deviceScaleFactor: 1 });
  await page.setContent('<!doctype html><html><body style="margin:0;background:#0b1220"></body></html>');

  const items = JOBS.map((j) => ({
    label: j.label,
    orig: b64(`public/${j.file}.jpg`),
    norm: b64(`public/entry-norm/${j.file}.png`),
  }));

  await page.evaluate(async (items) => {
    const H = 320;
    for (const rowName of ['orig', 'norm']) {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;gap:10px;padding:10px 10px 4px;align-items:flex-end';
      const tag = document.createElement('div');
      tag.textContent = rowName === 'orig' ? '原图（同高 320px）' : '归一化后（同高 320px）';
      tag.style.cssText = 'color:#94a3b8;font:12px system-ui;padding:0 10px';
      row.appendChild(tag);
      document.body.appendChild(row);
      for (const it of items) {
        const img = await new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = it[rowName]; });
        const w = Math.round(H * img.width / img.height);
        const box = document.createElement('div');
        box.style.cssText = 'color:#e2e8f0;font:13px system-ui';
        box.innerHTML = `<div>${it.label}</div>`;
        const c = document.createElement('canvas');
        c.width = w; c.height = H;
        c.style.cssText = `width:${w}px;height:${H}px;display:block;background:#fff`;
        box.appendChild(c);
        row.appendChild(box);
        c.getContext('2d').drawImage(img, 0, 0, w, H);
      }
    }
  }, items);

  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/compare-norm.png`, fullPage: true });
  console.log(`输出：${OUT}/compare-norm.png`);
  await page.close();
}

// ── 2) 真实尺寸渲染（DSF=4）────────────────────────────────────
{
  const page = await browser.newPage({ viewport: { width: 520, height: 420 }, deviceScaleFactor: 4 });
  await page.setContent('<!doctype html><html><body style="margin:0;background:#fff"></body></html>');

  const items = JOBS.map((j) => ({
    label: j.label, h: j.h, w: j.w,
    orig: b64(`public/${j.file}.jpg`),
    norm: b64(`public/entry-norm/${j.file}.png`),
  }));

  await page.evaluate(async (items) => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:8px;padding:8px';
    document.body.appendChild(wrap);

    for (const rowName of ['orig', 'norm']) {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;gap:8px;align-items:flex-end';
      const tag = document.createElement('div');
      tag.textContent = rowName === 'orig' ? '原图' : '归一化';
      tag.style.cssText = 'color:#64748b;font:10px system-ui;width:34px';
      row.appendChild(tag);
      wrap.appendChild(row);

      for (const it of items) {
        const box = document.createElement('div');
        box.style.cssText = `position:relative;width:${it.w}px;height:${it.h}px;background:#fff;` +
          'border:1px dashed #cbd5e1;box-sizing:content-box';
        const img = new Image();
        img.src = it[rowName];
        img.style.cssText = 'width:100%;height:100%;object-fit:contain;object-position:right bottom;display:block';
        await new Promise((r) => { img.onload = r; });
        box.appendChild(img);
        row.appendChild(box);
      }
    }
  }, items);

  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/real-size.png`, fullPage: true });
  console.log(`输出：${OUT}/real-size.png`);
  await page.close();
}

await browser.close();
