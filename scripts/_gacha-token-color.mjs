import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 1 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#nav-tab-gacha', { timeout: 20000 });
await page.waitForTimeout(600);
await page.click('#nav-tab-gacha');
await page.waitForSelector('#unified-pantry-big-card', { timeout: 15000 });
await page.waitForTimeout(1500);

const info = await page.evaluate(() => {
  const btn = document.getElementById('btn-header-tokens');
  const cs = getComputedStyle(btn);
  const h = btn.closest('header');
  const hcs = getComputedStyle(h);
  // 逐层找 opacity < 1 的祖先
  const chain = [];
  let el = btn;
  while (el && el !== document.documentElement) {
    const c = getComputedStyle(el);
    if (c.opacity !== '1' || c.filter !== 'none' || c.mixBlendMode !== 'normal')
      chain.push({ tag: el.tagName, id: el.id, cls: el.className.toString().slice(0, 40), opacity: c.opacity, filter: c.filter.slice(0, 30), blend: c.mixBlendMode });
    el = el.parentElement;
  }
  return {
    bg: cs.backgroundColor, opacity: cs.opacity, filter: cs.filter,
    headerBg: hcs.backgroundColor, headerBackdrop: hcs.backdropFilter,
    chain,
    btnRect: (() => { const b = btn.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height }; })(),
  };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
