/**
 * 截取「金枪鱼三明治」详情页背景（hero 区 + 整屏），用于查看/取色。
 * 用法：node scripts/shot-sandwich-bg.mjs
 */
import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
import fs from 'node:fs';

const keyword = process.argv[2] ?? '金枪鱼三明治';
const outDir = 'outputs/teriyaki-bg2';
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));

await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.waitForTimeout(700);

const clicked = await page.evaluate((kw) => {
  const thumb = [...document.querySelectorAll('[data-dish-thumb="true"]')].find((t) =>
    t.closest('.group')?.querySelector('h4')?.textContent?.includes(kw)
  );
  const card = thumb?.closest('.group');
  if (!card) return false;
  card.scrollIntoView({ block: 'center' });
  card.click();
  return true;
}, keyword);
if (!clicked) {
  console.log('没找到菜品：', keyword);
  await browser.close();
  process.exit(1);
}
await page.waitForTimeout(1600);
await page.waitForFunction(() => document.body.innerText.includes('加入购物车'), { timeout: 10000 }).catch(() => {});
await page.waitForTimeout(500);

// 1) 整屏
await page.screenshot({ path: `${outDir}/detail-full.png` });

// 2) 背景层信息：拿到详情覆盖层里那张 backdrop img 的 src / 计算后的底色
const info = await page.evaluate(() => {
  const imgs = [...document.querySelectorAll('img')].filter((i) => !i.src.includes('/dishes/'));
  const bd = imgs.find((i) => i.getBoundingClientRect().width > 300);
  const rect = bd?.getBoundingClientRect();
  const host = bd?.parentElement;
  return {
    bgImage: bd?.src ?? null,
    bgCssColor: host ? getComputedStyle(host).backgroundColor : null,
    bgBox: rect ? { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) } : null,
  };
});
console.log(JSON.stringify(info, null, 2));

// 3) 只截背景区域（不含前景文字层做法：先隐藏 hero 上的文字/按钮）
if (info.bgBox) {
  await page.screenshot({
    path: `${outDir}/bg-crop.png`,
    clip: { x: info.bgBox.x, y: info.bgBox.y, width: info.bgBox.w, height: info.bgBox.h },
  });
}

await browser.close();
console.log('saved to', outDir);
