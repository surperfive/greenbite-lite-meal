/** 窄屏与矮屏压测：280 / 300 / 320 + 横屏矮视口 */
import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const CASES = [
  { w: 280, h: 800, label: '超窄 280' },
  { w: 300, h: 800, label: '窄 300' },
  { w: 320, h: 568, label: 'iPhone SE 320x568' },
  { w: 430, h: 400, label: '横屏矮 430x400' },
];
const TABS = ['home','menu','orders','me'];
const browser = await chromium.launch({ channel: 'chrome' });
for (const c of CASES) {
  const page = await browser.newPage({ viewport: { width: c.w, height: c.h }, deviceScaleFactor: 1 });
  await page.goto(BASE, { waitUntil: 'commit' });
  await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(()=>{});
  await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 }).catch(()=>{});
  await page.waitForTimeout(400);
  console.log(`\n=== ${c.label} ===`);
  for (const t of TABS) {
    const has = await page.$(`#nav-tab-${t}`);
    if (!has) continue;
    await page.click(`#nav-tab-${t}`);
    await page.waitForTimeout(650);
    const r = await page.evaluate(() => {
      const stage = document.getElementById('app-page-stage');
      const scroller = stage.querySelector('*');
      // 找被文字撑破的元素（scrollWidth > clientWidth 且 overflow 非 auto/scroll）
      const bad = [];
      for (const el of stage.querySelectorAll('*')) {
        const cs = getComputedStyle(el);
        if (cs.overflowX === 'auto' || cs.overflowX === 'scroll') continue;
        if (el.scrollWidth > el.clientWidth + 2 && el.clientWidth > 0 && el.children.length === 0) {
          bad.push({ tag: el.tagName, t: (el.textContent||'').slice(0,18), sw: el.scrollWidth, cw: el.clientWidth });
        }
      }
      return {
        hScroll: document.documentElement.scrollWidth > window.innerWidth + 1,
        docW: document.documentElement.scrollWidth,
        vw: window.innerWidth,
        textClip: bad.length,
        sample: bad.slice(0,3),
      };
    });
    console.log(`  ${t.padEnd(7)} hScroll=${r.hScroll} (${r.docW}/${r.vw}) textClip=${r.textClip}${r.textClip?' '+JSON.stringify(r.sample):''}`);
  }
  await page.close();
}
await browser.close();
