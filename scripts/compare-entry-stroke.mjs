/**
 * 四张入口插画「同高并排」：验证描边粗细是否一致（同一高度下应该看起来一样粗）。
 * 用法：node scripts/compare-entry-stroke.mjs
 */
import { chromium } from 'playwright';
import { readFileSync, mkdirSync } from 'node:fs';

const FILES = [
  ['entry-takeout.jpg', '外卖配送'],
  ['entry-pickup.jpg', '到店自取'],
  ['entry-benefit.jpg', '福利中心'],
  ['entry-gacha.jpg', '今日抽卡'],
];
const OUT = 'outputs/entry-compare';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1400, height: 500 }, deviceScaleFactor: 1 });
await page.setContent('<!doctype html><html><body style="margin:0;background:#0b1220"></body></html>');

const items = FILES.map(([f, label]) => ({
  src: `data:image/jpeg;base64,${readFileSync(`public/${f}`).toString('base64')}`,
  label,
}));

await page.evaluate(async (items) => {
  const host = document.createElement('div');
  host.style.cssText = 'display:flex;gap:10px;padding:10px;align-items:flex-end';
  document.body.appendChild(host);
  const H = 320;
  for (const it of items) {
    const img = await new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = it.src; });
    const w = Math.round(H * img.width / img.height);
    const box = document.createElement('div');
    box.style.cssText = 'color:#e2e8f0;font:13px system-ui';
    box.innerHTML = `<div>${it.label} · ${img.width}×${img.height}</div>`;
    const c = document.createElement('canvas');
    c.width = w; c.height = H;
    c.style.cssText = `width:${w}px;height:${H}px;display:block;background:#fff`;
    box.appendChild(c);
    host.appendChild(box);
    c.getContext('2d').drawImage(img, 0, 0, w, H);
  }
}, items);

await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}/stroke-compare.png`, fullPage: true });
console.log(`输出：${OUT}/stroke-compare.png`);
await browser.close();
