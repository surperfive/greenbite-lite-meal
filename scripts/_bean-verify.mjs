/**
 * 改 tokens 后复查：主粮基底三卡外轮廓 + 份量规格/温度两列卡 + 详情页整段。
 * 用法：node scripts/_bean-verify.mjs
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { BASE } from './_base.mjs';

const OUT = 'scripts/_bean';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 3 });
await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
const page = await ctx.newPage();

await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#nav-tab-menu', { timeout: 60000 });
await page.waitForTimeout(500);
await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((x) => x.textContent?.trim() === '跳过');
  b?.click();
});
await page.waitForTimeout(800);
await page.locator('div.cursor-pointer', { hasText: '牛油果鸡胸沙拉' }).first().click();
await page.waitForTimeout(1500);

// 选中第三张基底
await page.evaluate(() => {
  const label = [...document.querySelectorAll('span')].find((s) => s.textContent?.trim() === '主粮基底');
  const grid = label?.closest('div')?.parentElement?.querySelector('.grid');
  grid?.children[2]?.click();
});
await page.waitForTimeout(600);

const clip = async (name, topText, h) => {
  await page.evaluate((t) => {
    const el = [...document.querySelectorAll('span')].find((s) => s.textContent?.trim() === t);
    el?.scrollIntoView({ block: 'center' });
  }, topText);
  await page.waitForTimeout(500);
  const box = await page.evaluate(([t, hh]) => {
    const el = [...document.querySelectorAll('span')].find((s) => s.textContent?.trim() === t);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: 0, y: Math.max(0, r.top - 10), width: 420, height: hh };
  }, [topText, h]);
  await page.screenshot({ path: `${OUT}/${name}.png`, clip: box, timeout: 60000 });
  console.log(name, JSON.stringify(box));
};

await clip('V1-主粮基底', '主粮基底', 104);
await clip('V2-份量规格', '份量规格', 190);
await clip('V3-特调酱汁', '特调酱汁', 120);

await browser.close();
console.log('done');
