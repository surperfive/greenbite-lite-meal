import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 3 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
try {
  await page.waitForSelector('.brand-loader__skip', { timeout: 8000 });
  await page.click('.brand-loader__skip');
  await page.waitForSelector('.brand-loader__skip', { state: 'detached', timeout: 8000 });
} catch {}
await page.waitForTimeout(1200);
const info = await page.evaluate(() => {
  const thumbs = [...document.querySelectorAll('[data-dish-thumb="true"]')];
  const out = [];
  for (const t of thumbs) {
    const art = t.firstElementChild; // DishCoverArt root
    const disc = art?.firstElementChild; // 椭圆盘 div
    const svg = art?.querySelector('svg');
    const r = (el) => { const b = el.getBoundingClientRect(); return { top: +b.top.toFixed(1), bottom: +b.bottom.toFixed(1), left: +b.left.toFixed(1), right: +b.right.toFixed(1), h: +b.height.toFixed(1) }; };
    out.push({
      name: t.closest('.group')?.querySelector('h4')?.textContent,
      thumb: r(t),
      artCls: art?.className?.slice(0, 40),
      disc: disc ? r(disc) : null,
      discBg: disc ? getComputedStyle(disc).backgroundColor : null,
      svgBottom: svg ? r(svg).bottom : null,
    });
  }
  return out;
});
for (const d of info) {
  console.log(`${d.name}: thumb ${d.thumb.top}~${d.thumb.bottom} (h=${d.thumb.h}) disc ${d.disc?.top}~${d.disc?.bottom} bg=${d.discBg}`);
}
await browser.close();
