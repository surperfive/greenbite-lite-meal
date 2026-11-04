import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 3 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.click('#nav-tab-me');
await page.waitForTimeout(1200);
await page.evaluate(() => { const sc = document.querySelector('.overflow-y-auto'); if (sc) sc.scrollTop = 99999; });
await page.waitForTimeout(600);
await page.getByRole('button', { name: /退出登录/ }).click();
await page.waitForTimeout(1200);
await page.evaluate(() => { const sc = document.querySelector('.overflow-y-auto'); if (sc) sc.scrollTop = 0; });
await page.waitForTimeout(700);
const info = await page.evaluate(() => {
  const lab = [...document.querySelectorAll('.pill-label')].find((e) => /开启元气/.test(e.textContent));
  if (!lab) return { err: 'pill not found', h1: document.querySelector('h1')?.textContent };
  let pill = lab.parentElement;
  while (pill && pill !== document.body) {
    const cs = getComputedStyle(pill);
    const r = Math.min(...[cs.borderTopLeftRadius, cs.borderTopRightRadius, cs.borderBottomLeftRadius, cs.borderBottomRightRadius].map(parseFloat));
    if (r >= 5) break;
    pill = pill.parentElement;
  }
  const b = pill.getBoundingClientRect();
  return { w: +b.width.toFixed(2), h: +b.height.toFixed(2), text: lab.textContent.trim() };
});
console.log(JSON.stringify(info));
await page.screenshot({ path: 'scripts/_shots/me-header-loggedout.png', clip: { x: 0, y: 0, width: 430, height: 210 } });
await browser.close();
