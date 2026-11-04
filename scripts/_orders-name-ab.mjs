/** A/B：菜名「显示全部」的两种方案 —— 缩字号 vs 换行 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';
const OUT = 'scripts/_shots';
fs.mkdirSync(OUT, { recursive: true });

const VARIANTS = [
  { id: 'A', label: '缩字号 12px', css: `font-size:12px !important;` },
  { id: 'B', label: '换行 2 行', css: `white-space:normal !important; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;` },
  { id: 'C', label: '换行不限行', css: `white-space:normal !important;` },
  { id: 'D', label: '12.5px + 换行', css: `font-size:12.5px !important; white-space:normal !important;` },
];

const browser = await chromium.launch({ channel: 'chrome' });
for (const v of VARIANTS) {
  const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
  await page.goto(BASE, { waitUntil: 'commit' });
  await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
  await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
  await page.waitForTimeout(500);
  await page.click('#nav-tab-orders');
  await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(900);
  await page.addStyleTag({ content: `.dish-name-probe{${v.css}}` });
  const m = await page.evaluate(() => {
    const p = [...document.querySelectorAll('p')].find(x => x.textContent.includes('牛油果鸡胸沙拉'));
    p.classList.add('dish-name-probe');
    const cs = getComputedStyle(p);
    const r = p.getBoundingClientRect();
    const parent = p.closest('div.flex-1');
    return {
      clientW: p.clientWidth, scrollW: p.scrollWidth, scrollH: p.scrollHeight, clientH: p.clientHeight,
      truncated: p.scrollWidth > p.clientWidth + 1,
      rectH: +r.height.toFixed(1),
      parentH: parent ? +parent.getBoundingClientRect().height.toFixed(1) : null,
    };
  });
  console.log(v.id, v.label, JSON.stringify(m));
  // 截图：第一张订单卡
  const box = await page.evaluate(() => {
    const p = [...document.querySelectorAll('p')].find(x => x.textContent.includes('牛油果鸡胸沙拉'));
    const card = p.closest('div.rounded-2xl, div.rounded-\\[24px\\]') || p.parentElement.parentElement.parentElement;
    const r = card.getBoundingClientRect();
    return { x: Math.max(0, r.x - 4), y: Math.max(0, r.y - 4), width: Math.min(430 - r.x + 4, r.width + 8), height: Math.min(932 - r.y + 4, r.height + 8) };
  });
  await page.screenshot({ path: `${OUT}/ab-name-${v.id}.png`, clip: box });
  await page.close();
}
await browser.close();
