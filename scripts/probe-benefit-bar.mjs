/**
 * 量「限时超值福利」条（青柠胶囊）与内部各块的几何，并 3× 截图。
 * 用法：node scripts/probe-benefit-bar.mjs [--shot]
 * 输出：outputs/benefit-bar/bar.png（3×）、bar-context.png
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { BASE } from './_base.mjs';

const SHOT = process.argv.includes('--shot');
mkdirSync('outputs/benefit-bar', { recursive: true });

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
  // 青柠条：文字「限时超值福利」往上找那个 h-* 的胶囊容器
  const title = [...document.querySelectorAll('span')].find((s) => s.textContent?.trim() === '限时超值福利');
  const bar = title.closest('.rounded-full');
  const circle = bar.querySelector('.rounded-full.bg-gradient-to-tr');
  const btn = [...bar.querySelectorAll('button')].find((b) => b.textContent?.includes('查看更多'));
  const limited = [...bar.querySelectorAll('span')].find((s) => s.textContent?.trim() === 'LIMITED TIME');
  const flame = bar.querySelector('svg');
  const cs = getComputedStyle(bar);
  const barR = bar.getBoundingClientRect();
  return {
    bar: r(bar), ratio: +(barR.width / barR.height).toFixed(3),
    pad: `${cs.paddingTop} ${cs.paddingRight} ${cs.paddingBottom} ${cs.paddingLeft}`,
    radius: cs.borderRadius,
    circle: circle ? r(circle) : null,
    flame: flame ? r(flame) : null,
    title: r(title), titleFs: getComputedStyle(title).fontSize,
    limited: limited ? { ...r(limited), fs: getComputedStyle(limited).fontSize } : null,
    btn: btn ? { ...r(btn), fs: getComputedStyle(btn).fontSize } : null,
    // 上下留白 = 内区减最高子块
    gapTop: circle ? +(circle.getBoundingClientRect().top - barR.top).toFixed(1) : null,
    gapBottom: circle ? +(barR.bottom - circle.getBoundingClientRect().bottom).toFixed(1) : null,
  };
});

const p = (o) => `${String(o.x).padStart(6)} ${String(o.y).padStart(6)}  ${String(o.w).padStart(6)} × ${String(o.h).padStart(6)}`;
console.log(`青柠条  ${p(info.bar)}  比例 ${info.ratio}  radius ${info.radius}  padding ${info.pad}`);
console.log(`  上下留白（相对圆徽章）  ${info.gapTop} / ${info.gapBottom}`);
console.log(`  圆徽章  ${info.circle ? p(info.circle) : '—'}   占条高 ${info.circle ? (info.circle.h / info.bar.h * 100).toFixed(0) : '—'}%`);
console.log(`  Flame   ${info.flame ? p(info.flame) : '—'}`);
console.log(`  标题    ${p(info.title)}  ${info.titleFs}`);
console.log(`  LIMITED ${info.limited ? p(info.limited) : '—'}  ${info.limited?.fs ?? ''}`);
console.log(`  按钮    ${info.btn ? p(info.btn) : '—'}  ${info.btn?.fs ?? ''}   占条高 ${info.btn ? (info.btn.h / info.bar.h * 100).toFixed(0) : '—'}%`);

if (SHOT) {
  const bar = await page.evaluateHandle(() =>
    [...document.querySelectorAll('span')].find((s) => s.textContent?.trim() === '限时超值福利').closest('.rounded-full'));
  await bar.asElement().screenshot({ path: 'outputs/benefit-bar/bar.png' });
  const sec = await bar.asElement().evaluateHandle((e) => e.parentElement);
  const box = await sec.asElement().boundingBox();
  await page.screenshot({ path: 'outputs/benefit-bar/bar-context.png', clip: { ...box, y: box.y - 10, height: box.height + 20 } });
  console.log('\n输出：outputs/benefit-bar/bar.png、bar-context.png');
}

await browser.close();
