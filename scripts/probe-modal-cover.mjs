/** 探查弹窗遮罩是否覆盖到底部（返回底部中心点命中的元素 + 截图像素色） */
import { chromium } from 'playwright';

const BASE = 'http://127.0.0.1:5173/';
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2, locale: 'zh-CN' });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#nav-tab-home', { state: 'visible', timeout: 25000 });
await page.waitForSelector('#app-loading-screen', { state: 'detached', timeout: 25000 }).catch(() => {});
await page.waitForTimeout(800);

await page.click('#nav-tab-gacha');
await page.waitForTimeout(900);
await page.evaluate(() => {
  const icon = document.querySelector('svg.lucide-info');
  icon?.closest('button')?.click();
});
await page.waitForTimeout(800);

const info = await page.evaluate(() => {
  const pts = [100, 400, 700, 880, 905, 925];
  const hit = pts.map((y) => {
    const el = document.elementFromPoint(215, y);
    const cls = (el?.className || '').toString().slice(0, 70);
    return { y, tag: el?.tagName, cls };
  });
  return {
    innerHeight: window.innerHeight,
    docH: document.documentElement.clientHeight,
    bodyH: document.body.getBoundingClientRect().height,
    scrollH: document.documentElement.scrollHeight,
    hit,
  };
});
console.log(JSON.stringify(info, null, 2));

await page.screenshot({ path: 'outputs/probe-cover.png', clip: { x: 0, y: 860, width: 430, height: 72 } });
await browser.close();
