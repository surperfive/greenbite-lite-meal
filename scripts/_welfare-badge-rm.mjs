/** 福利中心弹窗：删徽章前/后的构图对比（看左上角留白与标题位置）。 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';
fs.mkdirSync('scripts/_shots', { recursive: true });

const tag = process.argv[2] || 'before';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));

await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('#nav-tab-home', { timeout: 20000 });
await page.waitForTimeout(800);

// 首页 tab（App 默认落在点餐页）
await page.click('#nav-tab-home');
await page.waitForSelector('#home-benefit-card', { timeout: 8000 });
await page.waitForTimeout(700);
await page.click('#home-benefit-card');
await page.waitForSelector('#welfare-center-stage', { timeout: 5000 });
await page.waitForTimeout(1000);

const geo = await page.evaluate(() => {
  const q = (s) => document.querySelector(s);
  const box = (el) => {
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return { x: +b.x.toFixed(1), y: +b.y.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1) };
  };
  return {
    board: box(q('.wf-board')),
    badge: box(q('.wf-badge-wrap')),
    title: box(q('.wf-title-group')),
    gift: box(q('.wf-gift')),
  };
});
console.log(tag, JSON.stringify(geo, null, 2));
await page.screenshot({ path: `scripts/_shots/welfare-badge-${tag}.png` });
console.log('shot:', `welfare-badge-${tag}.png`);
await browser.close();
