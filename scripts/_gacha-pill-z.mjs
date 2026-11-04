import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 1 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#nav-tab-gacha', { timeout: 20000 });
await page.waitForTimeout(600);
await page.click('#nav-tab-gacha');
await page.waitForSelector('#unified-pantry-big-card', { timeout: 15000 });
await page.waitForTimeout(1200);

const info = await page.evaluate(() => {
  const el = document.querySelector('#unified-pantry-big-card div.relative.inline-flex');
  const btn = el.querySelectorAll('button')[0];
  const slider = btn.querySelector('span.pointer-events-none.absolute');
  const label = btn.querySelector('span.pill-label');
  const dump = (n) => {
    if (!n) return null;
    const cs = getComputedStyle(n);
    return { tag: n.tagName, cls: n.className.toString().slice(0, 60), z: cs.zIndex, pos: cs.position, tr: cs.transform.slice(0, 40), color: cs.color, opacity: cs.opacity };
  };
  const srect = slider?.getBoundingClientRect();
  const lrect = label?.getBoundingClientRect();
  return { btn: dump(btn), slider: dump(slider), label: dump(label),
    sliderRect: srect && { x: +srect.x.toFixed(1), y: +srect.y.toFixed(1), w: +srect.width.toFixed(1), h: +srect.height.toFixed(1) },
    labelRect: lrect && { x: +lrect.x.toFixed(1), y: +lrect.y.toFixed(1), w: +lrect.width.toFixed(1), h: +lrect.height.toFixed(1) },
    btnChildren: [...btn.children].map((c) => c.tagName + '.' + c.className.toString().slice(0, 40)) };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
