/**
 * 量首页四个入口卡的内部几何（标题 / 副标题 / 标签胶囊 / 插画），用来判断「放大标题」有没有撞车。
 * 用法：node scripts/probe-entry-card-text.mjs [--shot]
 * 输出：控制台表格；--shot 出 outputs/entry-text/grid.png（3×）
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { BASE } from './_base.mjs';

const SHOT = process.argv.includes('--shot');
mkdirSync('outputs/entry-text', { recursive: true });

const IDS = ['home-takeout-card', 'home-pickup-card', 'home-benefit-card', 'home-gacha-card'];

const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 3 });
await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
const page = await ctx.newPage();

await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#nav-tab-home', { timeout: 60000 });
await page.waitForTimeout(600);
await page.evaluate(() => {
  [...document.querySelectorAll('button')].find((x) => x.textContent?.trim() === '跳过')?.click();
});
await page.waitForTimeout(900);
await page.click('#nav-tab-home');
await page.waitForTimeout(1200);
await page.evaluate(() => { window.requestAnimationFrame = () => 0; });
await page.waitForTimeout(150);

const rows = await page.evaluate((ids) => {
  const rel = (el, base) => {
    const b = el.getBoundingClientRect();
    const p = base.getBoundingClientRect();
    return {
      x: +(b.x - p.x).toFixed(1), y: +(b.y - p.y).toFixed(1),
      w: +b.width.toFixed(1), h: +b.height.toFixed(1),
      right: +(b.right - p.x).toFixed(1), bottom: +(b.bottom - p.y).toFixed(1),
    };
  };
  return ids.map((id) => {
    const card = document.getElementById(id);
    const title = card.querySelector('span.font-black');
    const sub = card.querySelector('p');
    const badge = card.querySelector('.rounded-full.bg-black');
    const tagWrap = [...card.querySelectorAll('div.absolute')].find((d) => d.className.includes('bottom-'));
    const art = card.querySelector('img');
    const cs = getComputedStyle(title);
    return {
      id,
      card: { w: +card.getBoundingClientRect().width.toFixed(1), h: +card.getBoundingClientRect().height.toFixed(1) },
      title: { ...rel(title, card), fs: cs.fontSize, lh: cs.lineHeight, text: title.textContent.trim() },
      badge: badge ? rel(badge, card) : null,
      sub: sub ? { ...rel(sub, card), fs: getComputedStyle(sub).fontSize } : null,
      tags: tagWrap ? rel(tagWrap, card) : null,
      art: art ? rel(art, card) : null,
    };
  });
}, IDS);

for (const r of rows) {
  console.log(`\n${r.id}   卡 ${r.card.w}×${r.card.h}`);
  console.log(`  标题  x${r.title.x} y${r.title.y}  ${r.title.w}×${r.title.h}  ${r.title.fs} / lh ${r.title.lh}  「${r.title.text}」  右端 ${r.title.right}`);
  if (r.badge) console.log(`  箭头  x${r.badge.x} y${r.badge.y}  ${r.badge.w}×${r.badge.h}`);
  if (r.sub) console.log(`  副标题 y${r.sub.y} ~ ${r.sub.bottom}  ${r.sub.fs}`);
  if (r.tags) console.log(`  标签  y${r.tags.y} ~ ${r.tags.bottom}   左 ${r.tags.x} 右 ${r.tags.right}`);
  if (r.art) console.log(`  插画  x${r.art.x} y${r.art.y}  ${r.art.w}×${r.art.h}`);
  const gap = r.tags ? +(r.tags.y - (r.sub?.bottom ?? 0)).toFixed(1) : null;
  console.log(`  副标题→标签 余量 ${gap}px${gap !== null && gap < 6 ? '  ⚠️ 偏挤' : ''}`);
}

if (SHOT) {
  const grid = await page.evaluateHandle(() => document.getElementById('home-takeout-card').parentElement);
  const box = await grid.asElement().boundingBox();
  await page.screenshot({ path: 'outputs/entry-text/grid.png', clip: box });
  console.log('\n输出：outputs/entry-text/grid.png');
}
await browser.close();
