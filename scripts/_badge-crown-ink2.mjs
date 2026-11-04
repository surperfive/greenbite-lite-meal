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
const g = await page.evaluate(() => {
  const b = document.getElementById('badge-bubble').getBoundingClientRect();
  const c = document.getElementById('badge-crown').getBoundingClientRect();
  const t = document.getElementById('txt-discount').getBoundingClientRect();
  return {
    bubble: { x: b.x, y: b.y, w: b.width, h: b.height },
    crown: { x: c.x, y: c.y, w: c.width, h: c.height },
    text: { x: t.x, y: t.y, w: t.width, h: t.height },
  };
});
console.log(JSON.stringify(g));
// 夹紧在气泡内部（上下各让 3px，避开白胶囊边缘）
const top = g.bubble.y + 3;
const hgt = g.bubble.h - 6;
await page.screenshot({ path: 'scripts/_shots/ink-crown.png', clip: { x: g.crown.x - 1, y: top, width: g.crown.w + 2, height: hgt } });
await page.screenshot({ path: 'scripts/_shots/ink-text.png', clip: { x: g.text.x + 1, y: top, width: 10, height: hgt } });
await browser.close();
