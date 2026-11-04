/**
 * 未选中卡改白底后的回归：详情页全部规格组 + 抽卡食材卡（青柠底）+ 健康计划弹窗。
 * 输出 outputs/base-card/regress/
 */
import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
import fs from 'node:fs';

const OUT = 'outputs/base-card/regress';
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 2 });
await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
const page = await ctx.newPage();

const skipLoading = async () => {
  let calm = 0;
  for (let i = 0; i < 40 && calm < 2; i++) {
    if (!(await page.locator('[aria-label*="页面加载中"]').count())) {
      calm++;
      await page.waitForTimeout(450);
      continue;
    }
    calm = 0;
    await page.evaluate(() =>
      [...document.querySelectorAll('button')].find((x) => x.textContent?.trim().startsWith('跳过'))?.click()
    );
    await page.waitForTimeout(400);
  }
};

await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#nav-tab-menu', { timeout: 60000 });
await skipLoading();

// ---------- 详情页 ----------
await page.click('#nav-tab-menu');
await page.waitForTimeout(700);
await page.locator('div.cursor-pointer', { hasText: '牛油果鸡胸沙拉' }).first().click();
await page.waitForTimeout(1500);

const specShot = async (labelText, name) => {
  const box = await page.evaluate((t) => {
    const s = [...document.querySelectorAll('span')].find((el) => el.textContent?.trim() === t);
    const block = s?.parentElement?.parentElement;
    if (!block) return null;
    const r = block.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  }, labelText);
  if (!box) return console.log('  miss', labelText);
  await page.evaluate((t) => {
    const s = [...document.querySelectorAll('span')].find((el) => el.textContent?.trim() === t);
    s?.parentElement?.parentElement?.scrollIntoView({ block: 'center' });
  }, labelText);
  await page.waitForTimeout(350);
  const b2 = await page.evaluate((t) => {
    const s = [...document.querySelectorAll('span')].find((el) => el.textContent?.trim() === t);
    const r = s.parentElement.parentElement.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  }, labelText);
  await page.screenshot({
    path: `${OUT}/${name}.png`,
    clip: {
      x: Math.max(0, b2.x - 6),
      y: Math.max(0, b2.y - 18),
      width: Math.min(420, b2.w + 12),
      height: b2.h + 26,
    },
  });
  console.log('  ok', name);
};

await specShot('份量规格', '01-size');
await specShot('主粮基底', '02-base');
await specShot('特调酱汁', '03-sauce');

// ---------- 抽卡页食材卡 ----------
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#nav-tab-gacha', { timeout: 60000 });
await skipLoading();
await page.click('#nav-tab-gacha');
await page.waitForTimeout(1200);
await page.screenshot({ path: `${OUT}/04-gacha.png` });

// ---------- 健康计划弹窗 ----------
await page.click('#nav-tab-me');
await page.waitForTimeout(900);
const hp = page.locator('button,div', { hasText: '健康计划' }).first();
await hp.click({ force: true }).catch(() => {});
await page.waitForTimeout(1200);
await page.screenshot({ path: `${OUT}/05-health-plan.png` });

console.log('\n截图 →', OUT);
await browser.close();
