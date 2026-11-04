/**
 * 验证抽卡页顶部条是否真的吸顶。
 * 判定：滚动容器往下滚 N px 后，header 的视口 top 应保持在容器顶部（≈0），
 * 而不是跟着内容一起滚上去（变成负值）。
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { BASE } from './_base.mjs';

mkdirSync('probe-out/sticky-header', { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 3 });
const page = await ctx.newPage();
await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(700);
await page.evaluate(() => [...document.querySelectorAll('button')].find((x) => x.textContent?.trim() === '跳过')?.click());
await page.waitForTimeout(1200);
await page.click('#nav-tab-gacha');
await page.waitForTimeout(1400);

const probe = async (label) => {
  const r = await page.evaluate(() => {
    const header = document.querySelector('#gacha-page-root > header');
    const scroller = document.querySelector('#gacha-page-root')?.parentElement;
    if (!header || !scroller) return null;
    const cs = getComputedStyle(scroller);
    return {
      headerTop: Math.round(header.getBoundingClientRect().top),
      scrollerTop: Math.round(scroller.getBoundingClientRect().top),
      scrollTop: Math.round(scroller.scrollTop),
      scrollMax: Math.round(scroller.scrollHeight - scroller.clientHeight),
      scrollerClass: scroller.className.toString().slice(0, 70),
      overflowY: cs.overflowY,
      position: getComputedStyle(header).position,
      stickyTop: getComputedStyle(header).top
    };
  });
  console.log(label, JSON.stringify(r));
  return r;
};

await probe('滚动前 ');

// 先抽一次十连：食材库从 3 款涨到 10 款，页面可滚动量才够大，
// 否则初始只有 204px，吸顶与否看不出来。
await page.click('#btn-gacha-ten');
await page.waitForTimeout(10000);
await page.keyboard.press('Escape');
await page.waitForTimeout(500);
await probe('十连后 ');

// 滚动到 400px
await page.evaluate(() => {
  const s = document.querySelector('#gacha-page-root')?.parentElement;
  s.scrollTop = 400;
});
await page.waitForTimeout(400);
const after = await probe('滚动 400 后');

// 再滚到最底
await page.evaluate(() => {
  const s = document.querySelector('#gacha-page-root')?.parentElement;
  s.scrollTop = s.scrollHeight;
});
await page.waitForTimeout(400);
await probe('滚动到底 ');

await page.screenshot({ path: 'probe-out/sticky-header/scrolled.png' });

const pass = after && Math.abs(after.headerTop - after.scrollerTop) <= 2;
console.log(`\n${pass ? 'PASS' : 'FAIL'}  吸顶：滚动 400px 后 header 视口 top=${after?.headerTop}，滚动容器 top=${after?.scrollerTop}`);

await browser.close();
