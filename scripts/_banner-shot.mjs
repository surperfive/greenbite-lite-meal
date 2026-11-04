/**
 * 首页「限时超值福利」胶囊条抓图（3x，元素级）。
 * 用法：node scripts/_banner-shot.mjs [输出名]
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { BASE } from './_base.mjs';

const OUT = 'scripts/_banner';
mkdirSync(OUT, { recursive: true });
const name = process.argv[2] || 'shot';

const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 3 });
await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
const page = await ctx.newPage();

await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#nav-tab-menu', { timeout: 60000 });
await page.waitForTimeout(3200);        // 开机闪屏自动消失
await page.locator('#nav-tab-home').click();
await page.waitForTimeout(800);

// 切到首页会再弹一次加载遮罩，点「跳过」直到消失
for (let i = 0; i < 6; i++) {
  if (!(await page.evaluate(() => document.body.innerText.includes('FRESH FOOD')))) break;
  const skip = page.locator('text=跳过').first();
  if (await skip.count()) await skip.click({ timeout: 2000 }).catch(() => {});
  await page.waitForTimeout(600);
}
await page.waitForTimeout(900);

const info = await page.evaluate(() => {
  const el = [...document.querySelectorAll('div')].find(
    (d) => d.textContent?.includes('限时超值福利') && d.className.includes('bg-[#C7F665]')
  );
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return {
    h: +r.height.toFixed(1),
    w: +r.width.toFixed(1),
    badge: +el.querySelector('div').getBoundingClientRect().height.toFixed(1),
    btn: +el.querySelector('button').getBoundingClientRect().height.toFixed(1),
  };
});
console.log('尺寸', JSON.stringify(info));

const bar = page.locator('div.rounded-full', { hasText: '限时超值福利' }).first();
await bar.screenshot({ path: `${OUT}/${name}.png`, timeout: 60000 });
console.log('shot', name);

await browser.close();
