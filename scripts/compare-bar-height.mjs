/**
 * 「限时超值福利」条改高前后对照：从两张整页截图里裁同一块区域（含上下邻居），上下拼。
 * 用法：node scripts/compare-bar-height.mjs <before.png> <after.png> [裁剪y起点=560] [裁剪高=120]
 * 输出：outputs/benefit-bar/bar-before-after.png
 *
 * ⚠️ 两张截图必须是同一 deviceScaleFactor、同一滚动位置，否则裁出来对不齐。
 */
import { chromium } from 'playwright';
import { readFileSync, mkdirSync } from 'node:fs';

const [a, b, yArg, hArg] = process.argv.slice(2);
mkdirSync('outputs/benefit-bar', { recursive: true });
const cropY = Number(yArg || 560);
const cropH = Number(hArg || 120);

const b64 = (p) => `data:image/png;base64,${readFileSync(p).toString('base64')}`;

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 460, height: 400 }, deviceScaleFactor: 1 });
await page.setContent('<!doctype html><html><body style="margin:0;background:#0b1220;font:12px system-ui;color:#94a3b8"></body></html>');

const out = await page.evaluate(async ([A, B, cropY, cropH]) => {
  const load = (s) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = s; });
  const ia = await load(A), ib = await load(B);
  // 整页截图宽 = 410 × DSF，直接由宽度反推，别写死（shot-home-ref 是 2×，其它脚本可能是 3×）
  const s = ia.width / 410;
  const cut = (img) => {
    const c = document.createElement('canvas');
    c.width = Math.min(img.width, Math.round(410 * s));
    c.height = Math.round(cropH * s);
    const g = c.getContext('2d');
    g.drawImage(img, 0, cropY * s, c.width, c.height, 0, 0, c.width, c.height);
    return c;
  };
  const ca = cut(ia), cb = cut(ib);
  const w = ca.width;
  const host = document.createElement('div');
  host.style.cssText = 'padding:12px;display:flex;flex-direction:column;gap:4px';
  document.body.appendChild(host);
  const mk = (canvas, label, color) => {
    const d = document.createElement('div');
    d.innerHTML = `<div style="color:${color};padding:3px 1px">${label}</div>`;
    canvas.style.cssText = `display:block;width:${w}px;height:${ca.height}px;border-radius:8px`;
    d.appendChild(canvas);
    return d;
  };
  host.appendChild(mk(ca, `改前 · 条高 54px`, '#94a3b8'));
  host.appendChild(mk(cb, `改后 · 条高 46px（-15%）`, '#86efac'));
  return { w, h: ca.height };
}, [b64(a), b64(b), cropY, cropH]);

await page.setViewportSize({ width: out.w + 24, height: 400 });
await page.waitForTimeout(200);
await page.screenshot({ path: 'outputs/benefit-bar/bar-before-after.png', fullPage: true });
console.log(`输出：outputs/benefit-bar/bar-before-after.png  (${out.w}×${out.h} ×2)`);
await browser.close();
