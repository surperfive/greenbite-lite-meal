import { chromium } from 'playwright';
import fs from 'fs';

const BASE = 'http://127.0.0.1:5173/';
const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();

const collect = async () => {
  return page.evaluate(() => {
    const out = [];
    for (const img of document.querySelectorAll('img')) {
      const r = img.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      const cs = getComputedStyle(img);
      out.push({
        src: (img.currentSrc || img.src).replace(/^https?:\/\/[^/]+/, ''),
        how: 'img',
        fit: cs.objectFit,
        w: Math.round(r.width),
        h: Math.round(r.height),
      });
    }
    for (const el of document.querySelectorAll('*')) {
      const cs = getComputedStyle(el);
      const bg = cs.backgroundImage;
      if (!bg || bg === 'none' || !bg.includes('url(')) continue;
      const m = bg.match(/url\(["']?([^"')]+)["']?\)/);
      if (!m) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      out.push({
        src: m[1].replace(/^https?:\/\/[^/]+/, ''),
        how: 'bg',
        fit: cs.backgroundSize,
        w: Math.round(r.width),
        h: Math.round(r.height),
      });
    }
    return out;
  });
};

const all = [];
const go = async (tab) => {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2800);
  if (tab) {
    await page.click(`#nav-tab-${tab}`, { force: true });
    await page.waitForTimeout(2500);
  }
  all.push(...(await collect()));
};
for (const t of ['home', 'menu', 'gacha', 'orders', 'me']) await go(t);

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(2800);
await page.mouse.click(240, 300);
await page.waitForTimeout(1600);
all.push(...(await collect()));

await browser.close();

// 每张图：记录最大盒尺寸 + 所有出现过的 fit 值
const by = new Map();
for (const r of all) {
  const cur = by.get(r.src) || { src: r.src, fits: new Set(), maxArea: 0, w: 0, h: 0 };
  cur.fits.add(`${r.how}:${r.fit}`);
  if (r.w * r.h > cur.maxArea) {
    cur.maxArea = r.w * r.h;
    cur.w = r.w;
    cur.h = r.h;
  }
  by.set(r.src, cur);
}

const lines = [];
for (const v of [...by.values()].sort((a, b) => b.maxArea - a.maxArea)) {
  lines.push(`${String(v.w).padStart(4)}x${String(v.h).padEnd(4)} | ${[...v.fits].join(' , ').padEnd(40)} | ${v.src}`);
}
fs.writeFileSync('outputs/img-scan/fit.txt', lines.join('\n'), 'utf8');
console.log('ok', by.size);
