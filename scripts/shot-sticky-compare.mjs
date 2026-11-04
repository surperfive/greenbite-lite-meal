/**
 * 抽卡页顶部条吸顶的前后对比。
 * 用 addStyleTag 动态把 #gacha-page-root 的 overflow 在 clip / hidden 之间切换，
 * 不改源码，保证两张图的其他变量完全一致。
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { BASE } from './_base.mjs';

const OUT = 'probe-out/sticky-header';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 3 });
const page = await ctx.newPage();
await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(700);
await page.evaluate(() => [...document.querySelectorAll('button')].find((x) => x.textContent?.trim() === '跳过')?.click());
await page.waitForTimeout(1200);
await page.click('#nav-tab-gacha');
await page.waitForTimeout(1400);

// 抽一次十连，让食材库变长
await page.click('#btn-gacha-ten');
await page.waitForTimeout(10000);
await page.keyboard.press('Escape');
await page.waitForTimeout(500);

const scrollTo = async (y) => {
  await page.evaluate((v) => {
    const s = document.querySelector('#gacha-page-root')?.parentElement;
    if (s) s.scrollTop = v;
  }, y);
  await page.waitForTimeout(500);
};

const headerTop = () =>
  page.evaluate(() => Math.round(document.querySelector('#gacha-page-root > header')?.getBoundingClientRect().top ?? NaN));

// A：overflow-clip（当前实现）
await scrollTo(0);
await scrollTo(520);
console.log('overflow-clip  → header top =', await headerTop());
await page.screenshot({ path: `${OUT}/a-clip.png` });

// B：覆写成 overflow-hidden（旧实现）
await page.addStyleTag({ content: '#gacha-page-root{overflow:hidden !important}' });
await scrollTo(0);
await scrollTo(520);
console.log('overflow-hidden → header top =', await headerTop());
await page.screenshot({ path: `${OUT}/b-hidden.png` });

await browser.close();
