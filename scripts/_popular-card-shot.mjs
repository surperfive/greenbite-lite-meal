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
await page.click('#nav-tab-home');
await page.waitForTimeout(1200);
// 滚到人气卡区
await page.evaluate(() => {
  const el = document.getElementById('home-popular-dishes-section');
  el?.scrollIntoView({ block: 'start' });
  window.scrollBy(0, -60);
});
await page.waitForTimeout(800);
const info = await page.evaluate(() => {
  const sec = document.getElementById('home-popular-dishes-section');
  const imgBox = sec.querySelector('.aspect-square');
  const r = imgBox.getBoundingClientRect();
  return { t: +r.top.toFixed(0), h: +r.height.toFixed(0), bg: getComputedStyle(imgBox).backgroundColor };
});
console.log(JSON.stringify(info));
// 找纯灰区：图区顶部右侧（避开 HOT 徽章与食物）
const clipY = Math.max(0, info.t);
await page.screenshot({ path: 'scripts/_shots/popular-card-gray.png', clip: { x: 0, y: clipY, width: 430, height: Math.min(230, 932 - clipY) } });
await browser.close();
