/**
 * 探针：点「温度 / 主粮基底 / 份量」后，hero 食物图是否重播「下坠切换」。
 * 做法：点之前拍一帧，点完 90ms / 320ms 各拍一帧，hero 区域逐像素比对。
 * 用法：node scripts/_hero-switch-probe.mjs before|after
 */
import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
import fs from 'node:fs';

const TAG = process.argv[2] || 'before';
const OUT = `outputs/hero-switch/${TAG}`;
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 2 });
await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
const page = await ctx.newPage();

await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#nav-tab-menu', { timeout: 60000 });
let calm = 0;
for (let i = 0; i < 40 && calm < 2; i++) {
  if (!(await page.locator('[aria-label*="页面加载中"]').count())) {
    calm++;
    await page.waitForTimeout(500);
    continue;
  }
  calm = 0;
  await page.evaluate(() =>
    [...document.querySelectorAll('button')].find((x) => x.textContent?.trim().startsWith('跳过'))?.click()
  );
  await page.waitForTimeout(400);
}
await page.click('#nav-tab-menu');
await page.waitForTimeout(700);
await page.locator('div.cursor-pointer', { hasText: '牛油果鸡胸沙拉' }).first().click();
await page.waitForTimeout(2200);

const HERO = { x: 0, y: 0, width: 420, height: 250 };
const shot = (name) => page.screenshot({ path: `${OUT}/${name}.png`, clip: HERO });

// 通过区块标题找按钮，避免文案变化
const btn = async (section, index) => {
  const handle = await page.evaluateHandle(
    ({ section, index }) => {
      const label = [...document.querySelectorAll('span')].find(
        (s) => s.textContent?.trim() === section
      );
      const block = label?.parentElement?.parentElement;
      const grid = block?.querySelector('div.grid');
      return grid?.children[index] || null;
    },
    { section, index }
  );
  const el = handle.asElement();
  if (!el) throw new Error(`找不到 ${section}[${index}]`);
  return el;
};

const probe = async (name, section, index) => {
  await shot(`${name}-0`);
  const el = await btn(section, index);
  await el.click();
  await page.waitForTimeout(90);
  await shot(`${name}-t90`);
  await page.waitForTimeout(240);
  await shot(`${name}-t330`);
  await page.waitForTimeout(700);
  await shot(`${name}-settled`);
  console.log('  done', name);
};

console.log('— 点「温度」的第二个（温热/冰镇）');
await probe('01-temp', '温度', 1);
console.log('— 点「主粮基底」的第三个（生酮必选）');
await probe('02-base', '主粮基底', 2);
console.log('— 点「份量规格」的第二个（超大碗）');
await probe('03-size', '份量规格', 1);
console.log('— 点「特调酱汁」的第二个');
await probe('04-sauce', '特调酱汁', 1);

console.log(`\n帧 → ${OUT}`);
await browser.close();
