import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 3 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.click('#nav-tab-menu');
await page.waitForTimeout(900);

const r = await page.evaluate(() => {
  const out = {};
  // 找含「外卖」「自提」的切换器容器
  let box = null;
  for (const el of document.querySelectorAll('div')) {
    const t = el.textContent.replace(/\s+/g, '');
    if (t === '外卖自提') { box = el; break; }
  }
  if (!box) return { err: 'no box' };
  const br = box.getBoundingClientRect();
  out.box = { x: +br.left.toFixed(2), w: +br.width.toFixed(2), h: +br.height.toFixed(2) };
  const slider = box.querySelector('div');
  const sr = slider.getBoundingClientRect();
  out.slider = { x: +sr.left.toFixed(2), w: +sr.width.toFixed(2), h: +sr.height.toFixed(2), cls: slider.className.slice(0, 60) };
  out.buttons = [...box.querySelectorAll('button')].map((b) => {
    const r = b.getBoundingClientRect();
    const sp = b.querySelector('span');
    const sr2 = sp ? sp.getBoundingClientRect() : null;
    return {
      text: b.textContent.trim(),
      x: +r.left.toFixed(2), w: +r.width.toFixed(2), h: +r.height.toFixed(2),
      textCx: sr2 ? +(sr2.left + sr2.width / 2).toFixed(2) : null,
      btnCx: +(r.left + r.width / 2).toFixed(2),
    };
  });
  out.sliderCx = +(sr.left + sr.width / 2).toFixed(2);
  return out;
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
