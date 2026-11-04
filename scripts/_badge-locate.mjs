import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 1 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 30000 }).catch(() => {});
await page.waitForFunction(() => {
  const s = document.getElementById('app-page-stage');
  return s && getComputedStyle(s).opacity === '1';
}, { timeout: 30000 });
await page.click('#nav-tab-gacha');
await page.waitForTimeout(1800);
const info = await page.evaluate(() => {
  const el = document.getElementById('badge-bubble');
  const svg = el?.closest('svg');
  const r = el?.getBoundingClientRect();
  const sr = svg?.getBoundingClientRect();
  const st = el ? getComputedStyle(el) : null;
  // 徽章祖先链的可见性
  let chain = [];
  let cur = el;
  while (cur && cur !== document.body) {
    const cs = getComputedStyle(cur);
    if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) {
      chain.push(`${cur.id || cur.tagName}:${cs.display}/${cs.visibility}/${cs.opacity}`);
    }
    cur = cur.parentElement;
  }
  return { rect: r ? { x: +r.x.toFixed(0), y: +r.y.toFixed(0), w: +r.width.toFixed(0), h: +r.height.toFixed(0) } : null,
           svgRect: sr ? { y: +sr.y.toFixed(0), h: +sr.height.toFixed(0) } : null, hiddenChain: chain };
});
console.log(JSON.stringify(info));
await page.screenshot({ path: 'scripts/_shots/gacha-full.png', fullPage: false });
await browser.close();
