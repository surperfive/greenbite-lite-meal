import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.click('#nav-tab-menu');
await page.waitForTimeout(900);
const r = await page.evaluate(() => {
  const out = [];
  const seen = new Set();
  for (const el of document.querySelectorAll('.pill-label')) {
    const cs = getComputedStyle(el);
    const fs = parseFloat(cs.fontSize);
    const m = new DOMMatrixReadOnly(cs.transform);
    const key = `${fs}|${el.textContent.trim().slice(0, 8)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      text: el.textContent.trim().slice(0, 10),
      fs,
      display: cs.display,
      transform: cs.transform,
      ty: +m.f.toFixed(3),
      expect: +(-0.075 * fs).toFixed(3),
      em: +(m.f / fs).toFixed(4),
    });
  }
  return { count: document.querySelectorAll('.pill-label').length, items: out.slice(0, 14) };
});
console.log('pill-label 总数:', r.count);
for (const it of r.items) {
  console.log(`${String(it.fs).padStart(5)}px  ty=${String(it.ty).padStart(7)}  期望=${String(it.expect).padStart(7)}  em=${it.em}  ${it.display.padEnd(13)} «${it.text}»`);
}
await browser.close();
