/** 点击「蔬底」后，按时间采样三个标签的文字颜色，确认变色时机。 */
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

await page.evaluate(() => {
  window.__log = [];
  const el = document.querySelector('#unified-pantry-big-card div.relative.inline-flex');
  const t0 = performance.now();
  const tick = () => {
    const btns = [...el.querySelectorAll('button')];
    window.__log.push({
      t: +(performance.now() - t0).toFixed(0),
      c: btns.map((b) => {
        const l = b.querySelector('.pill-label');
        const cs = getComputedStyle(l);
        return cs.color.replace('rgb(', '').replace(')', '');
      }),
      hasSlider: btns.map((b) => !!b.querySelector('span.pointer-events-none')),
    });
    if (performance.now() - t0 < 700) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
});
await page.locator('#unified-pantry-big-card button').filter({ hasText: '蔬底' }).first().click();
await page.waitForTimeout(900);
const log = await page.evaluate(() => window.__log);
const pick = log.filter((_, i) => i % 3 === 0).slice(0, 26);
console.log(pick.map((l) => `${l.t}ms  全部[${l.c[0]}] 蛋白[${l.c[1]}] 蔬底[${l.c[2]}]  slider=${l.hasSlider.map((x) => (x ? 'Y' : '-')).join('')}`).join('\n'));
await browser.close();
