/** 诊断：确认 Range 行盒高度 / 字体度量 / 基线公式在 flex 上下文里的行为。 */
import { chromium } from 'playwright';
import { BASE } from './_base.mjs';

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.click('#nav-tab-menu');
await page.waitForTimeout(1000);

const out = await page.evaluate(() => {
  const cvs = document.createElement('canvas').getContext('2d');
  const targets = ['外卖', '搜索', '8.0折', '高膳食纤维'];
  const res = [];
  for (const t of targets) {
    const tn = [...document.querySelectorAll('*')].map((e) => e).length; // noop
    // 找最内层含该文本的元素
    const els = [...document.querySelectorAll('span,div,button')].filter(
      (e) => e.textContent.trim() === t && e.children.length === 0
    );
    for (const el of els.slice(0, 2)) {
      const pcs = getComputedStyle(el);
      const r = document.createRange();
      r.selectNodeContents(el);
      const rr = r.getBoundingClientRect();
      const pr = el.parentElement.getBoundingClientRect();
      const er = el.getBoundingClientRect();
      cvs.font = `${pcs.fontStyle} ${pcs.fontWeight} ${pcs.fontSize} ${pcs.fontFamily}`;
      const m = cvs.measureText(t);
      res.push({
        t,
        elTag: el.tagName,
        elDisplay: pcs.display,
        fs: pcs.fontSize,
        lh: pcs.lineHeight,
        elRect: { top: +er.top.toFixed(2), h: +er.height.toFixed(2) },
        rangeRect: { top: +rr.top.toFixed(2), h: +rr.height.toFixed(2) },
        parentDisplay: getComputedStyle(el.parentElement).display,
        parentRect: { top: +pr.top.toFixed(2), h: +pr.height.toFixed(2) },
        canvas: {
          fontAsc: +(m.fontBoundingBoxAscent ?? -1).toFixed(2),
          fontDesc: +(m.fontBoundingBoxDescent ?? -1).toFixed(2),
          inkAsc: +(m.actualBoundingBoxAscent ?? -1).toFixed(2),
          inkDesc: +(m.actualBoundingBoxDescent ?? -1).toFixed(2),
        },
      });
    }
  }
  return res;
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
