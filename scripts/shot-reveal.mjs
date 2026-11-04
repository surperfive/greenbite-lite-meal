/**
 * 抽卡揭示阶段抓图：确认「✨ 抽到 N 款食材」提示胶囊不再压住稀有度徽章。
 * 单抽 / 十连 × 两档视口高（844 = 手机壳等高，1100 = 明显高于手机壳）。
 * 用法：node scripts/shot-reveal.mjs
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { BASE } from './_base.mjs';

const OUT = 'outputs/reveal-pill';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });

const capture = async (vh, mode) => {
  const ctx = await browser.newContext({ viewport: { width: 420, height: vh }, deviceScaleFactor: 2 });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  const page = await ctx.newPage();

  await page.goto(BASE, { waitUntil: 'commit' });
  await page.waitForSelector('#nav-tab-gacha', { timeout: 60000 });
  await page.waitForTimeout(600);
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => x.textContent?.trim() === '跳过');
    b?.click();
  });
  await page.waitForTimeout(900);
  await page.click('#nav-tab-gacha');
  await page.waitForTimeout(1600);
  await page.locator(mode === 'ten' ? '#btn-gacha-ten' : '#btn-gacha-single').click();

  for (let i = 0; i < 200; i++) {
    if (await page.evaluate(() => !!document.querySelector('[data-reveal-card]'))) break;
    await page.waitForTimeout(40);
  }
  // 等 spring 收敛后再冻结（同 probe 的注释）
  await page.waitForTimeout(550);
  await page.evaluate(() => { window.requestAnimationFrame = () => 0; });
  await page.waitForTimeout(120);

  const name = `${mode}-vh${vh}`;
  await page.screenshot({ path: `${OUT}/${name}.png`, timeout: 60000 });
  console.log('captured', name);
  await ctx.close();
};

for (const vh of [844, 1100]) {
  await capture(vh, 'single');
  await capture(vh, 'ten');
}

await browser.close();
console.log(`\n输出目录：${OUT}`);
