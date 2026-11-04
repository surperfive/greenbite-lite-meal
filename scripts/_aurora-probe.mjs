import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 900 }, deviceScaleFactor: 1 });
await page.route('**://fonts.googleapis.com/**', (r) => r.abort());
await page.route('**://fonts.gstatic.com/**', (r) => r.abort());
await page.goto('http://localhost:5180/', { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { timeout: 20000 });
await page.waitForTimeout(350);
const read = async (t) => {
  await page.evaluate((ms) => {
    document.getAnimations().forEach((a) => {
      if (!(a.animationName ?? '').startsWith('brand-aurora')) return;
      a.pause(); a.currentTime = ms;
    });
  }, t);
  return page.evaluate(() => {
    const out = {};
    for (const k of ['a', 'b', 'c']) {
      const el = document.querySelector(`.brand-loader__blob--${k}`);
      const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
      out[k] = [Math.round(m.m41), Math.round(m.m42), Number(m.a.toFixed(3))];
    }
    return out;
  });
};
const t0 = await read(0);
const t2 = await read(620);
for (const k of ['a', 'b', 'c']) {
  const dx = t2[k][0] - t0[k][0], dy = t2[k][1] - t0[k][1];
  console.log(`光斑 ${k.toUpperCase()}: 620ms 位移 (${dx}, ${dy}) px, scale ${t0[k][2]}→${t2[k][2]}`);
}
await browser.close();
