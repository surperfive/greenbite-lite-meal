import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 4 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 30000 }).catch(() => {});
await page.waitForFunction(() => { const s = document.getElementById('app-page-stage'); return s && getComputedStyle(s).opacity === '1'; }, { timeout: 30000 });
await page.click('#nav-tab-gacha');
await page.waitForFunction(() => { const s = document.getElementById('app-page-stage'); return s && getComputedStyle(s).opacity === '1'; }, { timeout: 30000 });
await page.waitForTimeout(1600);
await page.addStyleTag({ content: '#badge-discount{animation:none!important;transform:none!important}' });
await page.waitForTimeout(300);
const r = await page.evaluate(() => {
  const b = document.getElementById('draw-buttons-banner').getBoundingClientRect();
  return { x: b.x, y: b.y, w: b.width, h: b.height };
});
// 按钮组整体（含徽章）
await page.screenshot({ path: 'scripts/_shots/bubble-buttons.png', clip: { x: r.x - 4, y: r.y - 6, width: r.w + 8, height: r.h + 12 } });
console.log(JSON.stringify(r));
await browser.close();
