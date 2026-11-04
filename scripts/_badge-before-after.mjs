/**
 * 徽章描边 改前/改后 对照（真实弹窗内，同一渲染环境，DOM 回滚不改源码）
 * after = 当前源码；before = 把 viewBox/尺寸/描边位置回滚成旧配置
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

const clip = await page.evaluate(() => {
  const svg = [...document.querySelectorAll('svg')].find((s) => s.querySelector('#gb-badge-grad'));
  const r = svg.parentElement.getBoundingClientRect();
  return { x: r.x - 10, y: r.y - 10, width: r.width + 26, height: r.height + 26 };
});

await page.screenshot({ path: `${OUT}/badge-ba-after.png`, clip });

// 回滚到旧配置
const rolled = await page.evaluate(() => {
  const svg = [...document.querySelectorAll('svg')].find((s) => s.querySelector('#gb-badge-grad'));
  const wrap = svg.parentElement;
  wrap.style.width = '68px';
  wrap.style.height = '56px';
  wrap.style.left = '-8px';
  wrap.style.top = '-14px';
  svg.setAttribute('viewBox', '56 30 210 172');
  const rects = [...svg.querySelectorAll('rect')];
  const strokeRect = rects[rects.length - 1];
  const isStrokeOnly = strokeRect.getAttribute('fill') === 'none';
  if (isStrokeOnly) strokeRect.remove();
  const fill = svg.querySelector('rect');
  fill.setAttribute('stroke', '#060804');
  fill.setAttribute('stroke-width', '9.5');
  return { removed: isStrokeOnly, vb: svg.getAttribute('viewBox'), w: wrap.style.width };
});
console.log('回滚', JSON.stringify(rolled));
await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}/badge-ba-before.png`, clip });
await browser.close();
