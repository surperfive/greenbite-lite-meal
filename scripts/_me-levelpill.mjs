import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 4 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.click('#nav-tab-me');
await page.waitForTimeout(1400);
const info = await page.evaluate(() => {
  const lab = [...document.querySelectorAll('.pill-label')].find((e) => /黄金会员|开启元气/.test(e.textContent));
  if (!lab) return { err: 'not found' };
  let pill = lab.parentElement;
  while (pill && pill !== document.body) {
    const cs = getComputedStyle(pill);
    const r = Math.min(...[cs.borderTopLeftRadius, cs.borderTopRightRadius, cs.borderBottomLeftRadius, cs.borderBottomRightRadius].map(parseFloat));
    if (r >= 5) break;
    pill = pill.parentElement;
  }
  pill.id = 'lp';
  const b = pill.getBoundingClientRect();
  const h1 = document.querySelector('h1').getBoundingClientRect();
  return { w: +b.width.toFixed(2), h: +b.height.toFixed(2), top: +b.top.toFixed(1), left: +b.left.toFixed(1), row1h: +h1.height.toFixed(2), text: lab.textContent.trim() };
});
console.log(JSON.stringify(info));
if (!info.err) {
  const b = await page.evaluate(() => { const r = document.getElementById('lp').getBoundingClientRect(); return { x: Math.max(0, r.left - 14), y: Math.max(0, r.top - 14), width: r.width + 28, height: r.height + 28 }; });
  await page.screenshot({ path: 'scripts/_shots/me-levelpill-zoom.png', clip: b });
  await page.evaluate(() => document.getElementById('lp').removeAttribute('id'));
}
await browser.close();
