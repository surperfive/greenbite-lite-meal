/**
 * 抽卡页「食材网格卡片」尺寸校验：插画是否被 overflow-hidden 裁切。
 *
 * 背景（2026-10-13）：卡片内原本挂了 sm: 变体（p-2 / badge h-5 / 菜名 11px），
 * 应用恒渲染在 410px 手机壳里，而 sm: 看的是**视口**宽度 —— 视口 >640px 时
 * 卡片内容整体变大，中间留给插画的高度被压到只剩 29px，50px 的图直接被裁。
 * 现在卡片内一律不挂 sm:，插画用 h-full w-auto 吃满图槽。
 *
 * 用法：node scripts/probe-card-fit.mjs
 *
 * ⚠️ 两个本机必踩的坑，写在这里省得下次再摸：
 *   1. 不能用 waitUntil:'domcontentloaded' —— 本机 Vite dev 的某个模块请求会 hang，
 *      DOMContentLoaded 永不触发，goto 直接 30s 超时。用 'commit' + waitForSelector。
 *   2. screenshot 会卡在 "waiting for fonts to load"（页面引了外部字体）。
 *      用 ctx.route 把 fonts.googleapis / fonts.gstatic 拦掉即可。
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { BASE } from './_base.mjs';

const OUT = 'probe-out/card-fit';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome', args: ['--no-proxy-server'] });
let failed = false;

for (const vw of [1400, 500]) {
  const ctx = await browser.newContext({ viewport: { width: vw, height: 900 }, deviceScaleFactor: 2 });
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
  await page.waitForTimeout(1200);
  await page.evaluate(() =>
    document.querySelector('#unified-pantry-collection-section')?.scrollIntoView({ block: 'center' })
  );
  await page.waitForTimeout(600);

  const m = await page.evaluate(() => {
    const card = document.querySelector('.grid > [class*="aspect-square"]');
    if (!card) return null;
    const cr = card.getBoundingClientRect();
    const img = card.querySelector('img').getBoundingClientRect();
    const slot = card.querySelector('.flex-1').getBoundingClientRect();
    return {
      cols: getComputedStyle(card.parentElement).gridTemplateColumns.split(' ').length,
      card: `${Math.round(cr.width)}x${Math.round(cr.height)}`,
      img: `${Math.round(img.width)}x${Math.round(img.height)}`,
      slot: `${Math.round(slot.width)}x${Math.round(slot.height)}`,
      clipped: img.height > slot.height + 1 || img.width > slot.width + 1
    };
  });

  if (!m) {
    console.log(`vw=${vw}  FAIL: 没找到卡片（页面没加载出来？）`);
    failed = true;
  } else {
    const tag = m.clipped ? 'FAIL 插画被裁' : 'ok';
    if (m.clipped) failed = true;
    console.log(
      `vw=${vw}  ${tag}  列数=${m.cols}  卡片=${m.card}  插画=${m.img}  图槽=${m.slot}`
    );
    // 列数必须是 3：卡片内不再有 sm: 断点，两种视口应完全一致
    if (m.cols !== 3) {
      console.log(`       WARN 列数应为 3，实际 ${m.cols}`);
      failed = true;
    }
  }

  await page.screenshot({ path: `${OUT}/vw-${vw}.png`, timeout: 60000 });
  await ctx.close();
}

await browser.close();
console.log(failed ? '\n结果：有项目未通过' : '\n结果：全部通过');
process.exit(failed ? 1 : 0);
