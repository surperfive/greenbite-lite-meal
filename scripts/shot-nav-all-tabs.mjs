/**
 * 底部导航改实心白后，五页底部各拍一张，确认没有破相（尤其 gacha 是 in-flow 模式）。
 * 用法：node scripts/shot-nav-all-tabs.mjs
 * 输出：outputs/nav-tabs/
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { BASE } from './_base.mjs';

const OUT = 'outputs/nav-tabs';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 390, height: 760 }, deviceScaleFactor: 3 });
await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
const page = await ctx.newPage();

const killLoader = async () => {
  for (let i = 0; i < 25; i++) {
    if (!(await page.locator('.brand-loader').count())) return;
    await page.locator('.brand-loader__skip').click({ timeout: 1200 }).catch(() => {});
    await page.waitForTimeout(400);
  }
};

await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#nav-tab-home', { timeout: 60000 });
await page.waitForTimeout(700);
await killLoader();

for (const tab of ['home', 'menu', 'gacha', 'orders', 'me']) {
  await page.click(`#nav-tab-${tab}`);
  await page.waitForTimeout(1300);
  await killLoader();
  // 每页滚到最底，看「内容结束处」与导航的关系
  await page.evaluate(() => {
    const sc = [...document.querySelectorAll('div.overflow-y-auto')].filter(
      (d) => d.scrollHeight > d.clientHeight + 4
    );
    sc.forEach((d) => d.scrollTo(0, d.scrollHeight));
  });
  await page.waitForTimeout(500);
  await killLoader();
  await page.screenshot({
    path: `${OUT}/${tab}-bottom.png`,
    clip: { x: 0, y: 620, width: 390, height: 140 },
  });
  const nav = await page.evaluate(() => {
    const n = document.getElementById('main-bottom-navigation-bar');
    const cs = getComputedStyle(n);
    const r = n.getBoundingClientRect();
    return {
      pos: cs.position,
      bg: cs.backgroundColor,
      blur: cs.backdropFilter,
      top: +r.top.toFixed(1),
      bottom: +r.bottom.toFixed(1),
    };
  });
  console.log(tab.padEnd(7), JSON.stringify(nav));
}

await browser.close();
console.log('→', OUT);
