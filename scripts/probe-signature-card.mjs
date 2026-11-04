/**
 * 量「招牌能量减脂餐」卡（#home-signature-card）与同排邀请卡的几何，
 * 以及卡内各块的实际占高 —— 改卡片比例前先知道预算花在哪。
 *
 * 用法：node scripts/probe-signature-card.mjs [--shot]
 * 输出：控制台表格；--shot 时额外存 outputs/signature-card/card.png（3×）
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { BASE } from './_base.mjs';

const SHOT = process.argv.includes('--shot');
mkdirSync('outputs/signature-card', { recursive: true });

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

const info = await page.evaluate(() => {
  const r = (el) => {
    const b = el.getBoundingClientRect();
    return { x: +b.x.toFixed(1), y: +b.y.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1) };
  };
  const sig = document.getElementById('home-signature-card');
  const inv = document.getElementById('home-invite-card');
  const cs = getComputedStyle(sig);

  // 卡内直接子块（文字块 / 底部图形块）
  const kids = [...sig.children].map((c) => ({
    tag: c.tagName.toLowerCase(),
    cls: c.className.toString().slice(0, 40),
    ...r(c),
  }));
  // 圆形插画 + 插画 img
  const circle = sig.querySelector('.rounded-full.overflow-hidden');
  const img = sig.querySelector('img');
  const crown = sig.querySelector('svg');
  const texts = [...sig.querySelectorAll('h4, p, span')].map((t) => ({
    t: t.textContent.trim().slice(0, 12),
    ...r(t),
    fs: getComputedStyle(t).fontSize,
  }));

  return {
    card: r(sig), invite: r(inv),
    ratio: +(sig.getBoundingClientRect().width / sig.getBoundingClientRect().height).toFixed(3),
    pad: `${cs.paddingTop} ${cs.paddingRight} ${cs.paddingBottom} ${cs.paddingLeft}`,
    scrollH: sig.scrollHeight, clientH: sig.clientHeight,
    kids,
    circle: circle ? r(circle) : null,
    img: img ? { ...r(img), src: img.getAttribute('src')?.slice(-40) } : null,
    crown: crown ? r(crown) : null,
    texts,
  };
});

const p = (o) => `${String(o.x).padStart(6)} ${String(o.y).padStart(6)}  ${String(o.w).padStart(6)} × ${String(o.h).padStart(6)}`;
console.log(`壳内 410 · 内容宽 390 · 两列 gap 6 → 每列应为 192`);
console.log(`招牌卡  ${p(info.card)}   比例 ${info.ratio}   padding ${info.pad}`);
console.log(`邀请卡  ${p(info.invite)}`);
console.log(`scrollH ${info.scrollH} / clientH ${info.clientH}  ${info.scrollH > info.clientH ? '⚠️ 溢出' : '未溢出'}`);
console.log('\n卡内直接子块：');
for (const k of info.kids) console.log(`  ${k.tag.padEnd(5)} ${p(k)}  ${k.cls}`);
console.log('\n插画 / 皇冠：');
console.log(`  圆形  ${info.circle ? p(info.circle) : '—'}`);
console.log(`  img   ${info.img ? p(info.img) : '—'}  ${info.img?.src ?? ''}`);
console.log(`  crown ${info.crown ? p(info.crown) : '—'}`);
console.log('\n文字块：');
for (const t of info.texts) console.log(`  ${t.t.padEnd(14)} ${p(t)}  ${t.fs}`);

if (SHOT) {
  const el = await page.$('#home-signature-card');
  await el.screenshot({ path: 'outputs/signature-card/card.png' });
  const grid = await el.evaluateHandle((e) => e.parentElement);
  const box = await grid.asElement().boundingBox();
  await page.screenshot({ path: 'outputs/signature-card/pair.png', clip: box });
  console.log('\n输出：outputs/signature-card/card.png、pair.png');
}

await browser.close();
