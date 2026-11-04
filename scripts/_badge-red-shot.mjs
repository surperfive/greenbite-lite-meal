import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 30000 }).catch(() => {});
await page.waitForFunction(() => {
  const s = document.getElementById('app-page-stage');
  return s && getComputedStyle(s).opacity === '1';
}, { timeout: 30000 });
await page.click('#nav-tab-gacha');
// 点击后再等 stage 真正可见（切页动画/挂载期间 opacity=0，第 22 轮坑）
await page.waitForFunction(() => {
  const s = document.getElementById('app-page-stage');
  return s && getComputedStyle(s).opacity === '1';
}, { timeout: 30000 });
await page.waitForTimeout(1500);
// 徽章 SVG 定位：第 13 轮起白描边改为大白胶囊（badge-white-pill 比 bubble 大一圈），
// 用白胶囊本体定位 + 外扩 8px，保证整颗（含旋转后的四角）都在画面内
const box = await page.evaluate(() => {
  const el = document.getElementById('badge-white-pill');
  const r = el.getBoundingClientRect();
  return { x: Math.max(0, r.x - 8), y: Math.max(0, r.y - 8), width: r.width + 16, height: r.height + 16 };
});
console.log(JSON.stringify(box));
await page.screenshot({ path: 'scripts/_shots/badge-red.png', clip: box });
await browser.close();
