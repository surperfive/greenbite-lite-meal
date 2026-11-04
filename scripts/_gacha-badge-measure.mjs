/** 精确测量「9折限时」徽章内部三个元素的几何关系（用户坐标 + 屏幕坐标） */
import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.waitForTimeout(600);
await page.click('#nav-tab-gacha');
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 15000 }).catch(() => {});
await page.waitForSelector('#badge-discount', { state: 'visible', timeout: 15000 });
await page.waitForTimeout(900);
const m = await page.evaluate(() => {
  const svg = document.querySelector('#badge-discount').closest('svg');
  const ctm = svg.getScreenCTM();
  const round = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, +v.toFixed(2)]));
  const bboxOf = (id) => {
    const el = document.getElementById(id);
    const b = el.getBBox();
    return { x: +b.x.toFixed(2), y: +b.y.toFixed(2), w: +b.width.toFixed(2), h: +b.height.toFixed(2) };
  };
  return {
    viewBox: svg.getAttribute('viewBox'),
    screen: { w: +svg.getBoundingClientRect().width.toFixed(2), h: +svg.getBoundingClientRect().height.toFixed(2) },
    ctmScale: { a: +ctm.a.toFixed(4), d: +ctm.d.toFixed(4) },
    bubble: bboxOf('badge-bubble'),
    crown: bboxOf('badge-crown'),
    text: bboxOf('txt-discount'),
    textAttrs: {
      x: document.getElementById('txt-discount').getAttribute('x'),
      y: document.getElementById('txt-discount').getAttribute('y'),
      fontSize: document.getElementById('txt-discount').getAttribute('font-size'),
      textLength: document.getElementById('txt-discount').getAttribute('textLength'),
    },
  };
});
console.log(JSON.stringify(m, null, 1));
await browser.close();
