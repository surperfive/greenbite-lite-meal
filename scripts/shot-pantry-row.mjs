import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
import fs from 'node:fs';

const OUT = process.argv[2] || 'outputs/pantry-row';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 3 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.click('#nav-tab-gacha');
await page.waitForSelector('#unified-pantry-big-card', { timeout: 20000 });
await page.waitForTimeout(2000); // 等抽卡页进场淡入结束，否则整片发白

const card = page.locator('#unified-pantry-big-card');
await card.scrollIntoViewIfNeeded();
await page.waitForTimeout(400);
await card.screenshot({ path: `${OUT}/pantry-card.png` });

// 顶部那一行（分类条 + 全选）
const row = card.locator('div.flex.items-center.justify-end, div.flex.items-center.justify-between').first();
const rb = await row.boundingBox();
const cb = await card.boundingBox();
await page.screenshot({
  path: `${OUT}/pantry-row.png`,
  clip: { x: rb.x - 4, y: rb.y - 4, width: rb.width + 8, height: rb.height + 8 },
});

const info = await page.evaluate(() => {
  const c = document.querySelector('#unified-pantry-big-card');
  const r = c.querySelector('div.flex.items-center.justify-end, div.flex.items-center.justify-between');
  const btn = document.querySelector('#btn-category-select-all-pill');
  const grid = c.querySelector('.grid');
  const gb = grid.getBoundingClientRect();
  const bb = btn.getBoundingClientRect();
  return {
    rowH: +r.getBoundingClientRect().height.toFixed(1),
    selectAll: { x: +bb.x.toFixed(1), right: +bb.right.toFixed(1) },
    cardRight: +c.getBoundingClientRect().right.toFixed(1),
    gridTop: +gb.y.toFixed(1),
    gridH: +gb.height.toFixed(1),
    tabCount: [...c.querySelectorAll('button')].filter((b) => ['全部', '蛋白', '蔬底'].includes(b.textContent.trim())).length,
  };
});
console.log(JSON.stringify(info));
await browser.close();
