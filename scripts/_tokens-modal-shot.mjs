/**
 * 「获取抽卡币」弹窗截图：整屏 + 弹窗局部（3x）。
 * 入口 = 抽卡页顶栏 #btn-header-tokens。
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';
const OUT = 'scripts/_shots';
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 3 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.waitForTimeout(600);
await page.click('#nav-tab-gacha');
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 15000 }).catch(() => {});
await page.waitForSelector('#btn-header-tokens', { state: 'visible', timeout: 15000 });
await page.waitForTimeout(800);
await page.click('#btn-header-tokens');
await page.waitForTimeout(900);

const box = await page.evaluate(() => {
  // 弹窗主卡 = 含「获取」标题的那个圆角白卡
  const h = [...document.querySelectorAll('h3')].find((e) => e.textContent?.includes('获取'));
  const card = h?.closest('.rounded-\\[20px\\]') ?? h?.parentElement?.parentElement;
  const r = card.getBoundingClientRect();
  return { x: r.x, y: r.y, width: r.width, height: r.height };
});
console.log('弹窗尺寸', JSON.stringify(box));
await page.screenshot({ path: `${OUT}/tokens-modal.png`, clip: { x: box.x - 14, y: box.y - 14, width: box.width + 28, height: box.height + 28 } });
const full = await page.evaluate(() => {
  const stage = document.getElementById('app-page-stage');
  const b = stage.parentElement.getBoundingClientRect();
  return { x: b.x, y: b.y, width: b.width, height: b.height };
});
await page.screenshot({ path: `${OUT}/tokens-modal-full.png`, clip: full });
await browser.close();
