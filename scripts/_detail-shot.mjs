import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 1 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 30000 }).catch(() => {});
async function stageReady() {
  await page.waitForFunction(() => {
    const s = document.getElementById('app-page-stage');
    return s && getComputedStyle(s).opacity === '1';
  }, { timeout: 30000 });
}
await stageReady();
await page.waitForTimeout(2500);
// 点第一张人气卡进入详情
await page.click('#nav-tab-home');
await stageReady();
await page.waitForTimeout(1500);
await page.evaluate(() => {
  const cards = document.querySelectorAll('#home-popular-dishes-section .grid > div');
  // 找绿色系的那张（羽衣甘蓝/沙拉）
  cards[0]?.click();
});
await page.waitForTimeout(2500);
await page.screenshot({ path: 'scripts/_shots/detail-page.png', fullPage: true });
const hero = await page.evaluate(() => {
  const imgs = [...document.querySelectorAll('img')].filter(i => i.src.includes('backdrops') || i.src.includes('dishes/large'));
  return imgs.map(i => ({ src: i.src.split('/').pop(), w: Math.round(i.getBoundingClientRect().width), h: Math.round(i.getBoundingClientRect().height) }));
});
console.log(JSON.stringify(hero));
await browser.close();
