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
await page.waitForTimeout(1000);

// 冻结自动轮播：清掉页面里所有 interval（仅本页调试用）
await page.evaluate(() => {
  const id = window.setInterval(() => {}, 100000);
  for (let i = 1; i <= id; i++) window.clearInterval(i);
});
await page.click('button[aria-label="切换到第 4 张轮播图"]');
await page.waitForTimeout(900);
const st = await page.evaluate(() => {
  const imgs = [...document.querySelectorAll('img')].filter(i => i.src.includes('hero-poster'));
  const active = imgs.find(i => {
    const d = i.closest('div[class*="transition-all"]');
    return d && getComputedStyle(d).opacity === '1';
  });
  return { src: active?.src.split('/').pop(), loaded: active?.complete && active?.naturalWidth > 0 };
});
console.log(JSON.stringify(st));
await page.screenshot({ path: 'scripts/_shots/banner4.png', clip: { x: 0, y: 0, width: 430, height: 310 } });
await browser.close();
