/**
 * Z 形划痕改前/改后对照：只回滚 DOM 属性，不碰源码，保证同一渲染环境。
 * before = viewBox 0 0 400 34 + h-[20px] mt-2.5（旧）
 * after  = viewBox -3.5 -4.5 408 37 + h-[22px] mt-2
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';
const OUT = 'scripts/_shots';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 4 });
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

// 固定一个稍宽的裁切框（覆盖两种 viewBox 的外沿）
const clip = await page.evaluate(() => {
  const svg = [...document.querySelectorAll('svg')].find((s) => s.querySelector('path[stroke="#C8FF1A"]'));
  const r = svg.getBoundingClientRect();
  return { x: r.x - 12, y: r.y - 12, width: r.width + 24, height: r.height + 24 };
});

const shot = async (name) => {
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${OUT}/${name}.png`, clip });
};

// after（当前源码）
await shot('z-after');

// before：回滚属性
await page.evaluate(() => {
  const svg = [...document.querySelectorAll('svg')].find((s) => s.querySelector('path[stroke="#C8FF1A"]'));
  svg.setAttribute('viewBox', '0 0 400 34');
  svg.classList.remove('h-[22px]', 'mt-2');
  svg.classList.add('h-[20px]', 'mt-2.5');
});
await shot('z-before');

// 量一下回滚是否生效
const check = await page.evaluate(() => {
  const svg = [...document.querySelectorAll('svg')].find((s) => s.querySelector('path[stroke="#C8FF1A"]'));
  return { vb: svg.getAttribute('viewBox'), h: getComputedStyle(svg).height };
});
console.log('回滚确认', JSON.stringify(check));
await browser.close();
