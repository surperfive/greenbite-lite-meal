/**
 * 逐个 Tab 截图，用于对比加载屏与主应用的设计语言。
 * 用法：node scripts/shot-app.mjs
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { BASE } from './_base.mjs';

const OUT = 'probe-out/app';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({
  viewport: { width: 420, height: 900 },
  deviceScaleFactor: 2
});
const page = await ctx.newPage();
// 本机 playwright 必拦：否则 page.screenshot 会卡在 "waiting for fonts to load"
await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());

const freezeRaf = async () => {
  await page.evaluate(() => {
    window.requestAnimationFrame = () => 0;
  });
};

const shot = async (name, prepare) => {
  await page.goto(BASE, { waitUntil: 'commit' });
  // 跳过加载屏
  await page.waitForTimeout(600);
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === '跳过');
    btn?.click();
  });
  await page.waitForTimeout(900);
  if (prepare) await prepare();
  await page.waitForTimeout(700);
  await freezeRaf();
  await page.screenshot({ path: `${OUT}/${name}.png`, timeout: 60000 });
  console.log('captured', name);
};

// ⚠️ App.tsx 的默认 activeTab 是 'menu'（不是 'home'），
// 所以必须先点一次「首页」才会真的进首页，否则 01-home 截出来是点餐页。
await shot('01-home', async () => {
  await page.click('#nav-tab-home');
});
await shot('02-menu', async () => {
  await page.click('#nav-tab-menu');
});
await shot('03-gacha', async () => {
  await page.click('#nav-tab-gacha');
});
await shot('04-orders', async () => {
  await page.click('#nav-tab-orders');
});
await shot('05-me', async () => {
  await page.click('#nav-tab-me');
});

await browser.close();
console.log(`\n输出目录：${OUT}`);
