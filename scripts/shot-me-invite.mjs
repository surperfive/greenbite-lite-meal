/**
 * 「我的」页邀请好友卡片换成整图后的抓图。
 * 用法：node scripts/shot-me-invite.mjs
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { BASE } from './_base.mjs';

const OUT = 'outputs/me-invite';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 2 });
await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
const page = await ctx.newPage();

await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#nav-tab-me', { timeout: 60000 });
await page.waitForTimeout(600);
await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((x) => x.textContent?.trim() === '跳过');
  b?.click();
});
await page.waitForTimeout(900);
await page.click('#nav-tab-me');
await page.waitForTimeout(1400);
await page.evaluate(() => { window.requestAnimationFrame = () => 0; });

// 整页滚到邀请卡所在处（邀请卡在页面中部）
const m = await page.evaluate(() => {
  const img = document.querySelector('img[src="/invite-card.png"]');
  if (!img) return null;
  img.scrollIntoView({ block: 'center' });
  const r = img.getBoundingClientRect();
  const shell = img.closest('div[class*="max-w-[410px]"]');
  const sr = shell?.getBoundingClientRect();
  return { w: +r.width.toFixed(1), h: +r.height.toFixed(1), ratio: +(r.height / r.width).toFixed(3) };
});
console.log('邀请卡图片渲染尺寸:', JSON.stringify(m));

await page.waitForTimeout(700);
await page.evaluate(() => { window.requestAnimationFrame = () => 0; });
const box = await page.evaluate(() => {
  const el = document.querySelector('#nav-tab-me')?.closest('div[class*="max-w-[410px]"]');
  const r = el?.getBoundingClientRect();
  return r ? { x: r.x, y: r.y, width: r.width, height: r.height } : null;
});
await page.screenshot({ path: `${OUT}/me-invite-after.png`, clip: box ?? undefined, timeout: 60000 });
console.log('captured me-invite-after');

await browser.close();
