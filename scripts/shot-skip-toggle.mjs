/**
 * 抽卡页「跳过动画」勾选框 —— 校验选中后的填充色。
 * 输出：outputs/skip-toggle/off.png / on.png / zoom-on.png
 */
import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
import fs from 'node:fs';

const OUT = 'outputs/skip-toggle';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 420, height: 940 }, deviceScaleFactor: 3 });
await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
const page = await ctx.newPage();

await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#nav-tab-gacha', { timeout: 60000 });
await page.waitForTimeout(600);
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === '跳过');
  btn?.click();
});
await page.waitForTimeout(900);
await page.click('#nav-tab-gacha');
await page.waitForTimeout(1400);

const label = page.locator('#skip-animation-toggle');
await label.scrollIntoViewIfNeeded();
await page.waitForTimeout(300);

const box = await label.boundingBox();
const read = async () =>
  page.evaluate(() => {
    const l = document.querySelector('#skip-animation-toggle');
    const boxEl = l?.querySelector('div');
    if (!boxEl) return null;
    const cs = getComputedStyle(boxEl);
    return {
      bg: cs.backgroundColor,
      border: cs.borderColor,
      w: cs.width,
      h: cs.height,
      checked: !!boxEl.querySelector('svg'),
    };
  });

const clipShot = async (path, pad = 10) => {
  const b = await label.boundingBox();
  await page.screenshot({
    path,
    clip: {
      x: Math.max(0, b.x - pad),
      y: Math.max(0, b.y - pad),
      width: Math.min(420, b.width + pad * 2),
      height: b.height + pad * 2,
    },
  });
};

console.log('未选中:', JSON.stringify(await read()));
await clipShot(`${OUT}/off.png`);

await label.click();
await page.waitForTimeout(420);
console.log('已选中:', JSON.stringify(await read()));
await clipShot(`${OUT}/on.png`);

// 放大特写：只看勾选框本体
const cb = page.locator('#skip-animation-toggle > div');
await cb.screenshot({ path: `${OUT}/box-on.png` });

// 附近全选胶囊 + 分类 tab 的当前状态，便于确认没有连带改动
const nearby = await page.evaluate(() => {
  const all = document.querySelector('#btn-category-select-all-pill');
  const active = [...document.querySelectorAll('#unified-pantry-big-card button')].find(
    (b) => getComputedStyle(b).backgroundColor === 'rgb(0, 0, 0)' && b.textContent?.trim().length <= 3
  );
  return {
    selectAllBg: all ? getComputedStyle(all).backgroundColor : null,
    activeTabBorder: active ? getComputedStyle(active).borderColor : null,
  };
});
console.log('邻近控件:', JSON.stringify(nearby));

await page.screenshot({ path: `${OUT}/area.png`, clip: { x: 0, y: Math.max(0, box.y - 90), width: 420, height: 300 } });

await browser.close();
console.log(`\n截图 → ${OUT}`);
