import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 4 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 30000 }).catch(() => {});
await page.waitForFunction(() => {
  const s = document.getElementById('app-page-stage');
  return s && getComputedStyle(s).opacity === '1';
}, { timeout: 30000 });
await page.click('#nav-tab-gacha');
await page.waitForFunction(() => {
  const s = document.getElementById('app-page-stage');
  return s && getComputedStyle(s).opacity === '1';
}, { timeout: 30000 });
await page.waitForTimeout(1500);
const r = await page.evaluate(() => {
  const c = document.getElementById('badge-crown').getBoundingClientRect();
  const t = document.getElementById('txt-discount').getBoundingClientRect();
  return { crown: { x: c.x, y: c.y, w: c.width, h: c.height }, text: { x: t.x, y: t.y, w: t.width, h: t.height } };
});
console.log(JSON.stringify(r));
// 皇冠条：只取皇冠 x 范围，y 上下各放 4px
await page.screenshot({ path: 'scripts/_shots/strip-crown.png', clip: { x: r.crown.x - 1, y: r.crown.y - 4, width: r.crown.w + 2, height: r.crown.h + 8 } });
// 首字条：文字最左 12px
await page.screenshot({ path: 'scripts/_shots/strip-text.png', clip: { x: r.text.x, y: r.text.y - 4, width: 12, height: r.text.h + 8 } });
await browser.close();
