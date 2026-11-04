import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
import { mkdirSync } from 'node:fs';

const OUT = process.argv[2] ?? 'outputs/health-plan-btn';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 3 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForTimeout(800);

await page.click('#nav-tab-me');
await page.waitForTimeout(600);
// 展开「更多工具」区，露出健康计划入口
await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((x) => x.textContent?.trim().includes('更多'));
  b?.click();
});
await page.waitForTimeout(600);
await page.getByRole('button', { name: '健康计划' }).first().click();
await page.waitForTimeout(900);

const btn = page.getByRole('button', { name: '保存健康计划' });
await btn.scrollIntoViewIfNeeded();
await page.waitForTimeout(300);
await page.mouse.move(5, 5);
await page.waitForTimeout(250);

const style = await btn.evaluate((el) => {
  const cs = getComputedStyle(el);
  return {
    border: cs.borderTopWidth + ' ' + cs.borderTopStyle + ' ' + cs.borderTopColor,
    bg: cs.backgroundColor,
    boxShadow: cs.boxShadow,
    radius: cs.borderTopLeftRadius,
    h: +el.getBoundingClientRect().height.toFixed(1),
    w: +el.getBoundingClientRect().width.toFixed(1),
  };
});
console.log(JSON.stringify(style, null, 1));

// 整卡截图 + 按钮附近裁切（按钮祖先有 transform，元素级截图会错位）
const panel = await page.evaluate(() => {
  const r = document.querySelector('.rounded-\\[24px\\].shadow-2xl').getBoundingClientRect();
  return { x: r.x, y: r.y, w: r.width, h: r.height };
});
await page.screenshot({ path: `${OUT}/modal.png` });
const box = await btn.boundingBox();
await page.screenshot({
  path: `${OUT}/btn.png`,
  clip: { x: box.x - 14, y: box.y - 14, width: box.width + 28, height: box.height + 30 },
});
console.log('panel', JSON.stringify(panel), 'btnBox', JSON.stringify(box));
await browser.close();
