/**
 * 四个入口卡「标题放大」前后对照：同一页面，用内联样式把标题/箭头徽章临时改回旧值各截一张，上下拼。
 * 不改源码。用法：node scripts/compare-entry-title.mjs [旧字号=18] [旧徽章=15] [旧chevron=10]
 * 输出：outputs/entry-text/title-before-after.png
 */
import { chromium } from 'playwright';
import { mkdirSync, readFileSync } from 'node:fs';
import { BASE } from './_base.mjs';

const OLD_FS = Number(process.argv[2] || 18);
const OLD_BADGE = Number(process.argv[3] || 15);
const OLD_CHEV = Number(process.argv[4] || 10);
const OUT = 'outputs/entry-text';
mkdirSync(OUT, { recursive: true });

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

const grid = await page.evaluateHandle(() => document.getElementById('home-takeout-card').parentElement);
const box = await grid.asElement().boundingBox();

const apply = (fs, badge, chev) => page.evaluate(([ids, fs, badge, chev]) => {
  for (const id of ids) {
    const card = document.getElementById(id);
    const t = card.querySelector('span.font-black');
    const b = card.querySelector('.rounded-full.bg-black');
    const c = b?.querySelector('svg');
    if (fs) t.style.fontSize = fs + 'px';
    else t.style.fontSize = '';
    if (badge && b) { b.style.width = badge + 'px'; b.style.height = badge + 'px'; }
    if (chev && c) { c.style.width = chev + 'px'; c.style.height = chev + 'px'; }
  }
}, [IDS, fs, badge, chev]);

const shot = async (fs, badge, chev, name) => {
  await apply(fs, badge, chev);
  await page.waitForTimeout(200);
  const p = `${OUT}/${name}.png`;
  await page.screenshot({ path: p, clip: box, timeout: 60000 });
  return p;
};

const before = await shot(OLD_FS, OLD_BADGE, OLD_CHEV, 'title-before');
const after = await shot(null, null, null, 'title-after');

const b64 = (p) => `data:image/png;base64,${readFileSync(p).toString('base64')}`;
const cmp = await ctx.newPage();
await cmp.setViewportSize({ width: 1240, height: 900 });
await cmp.setContent(`<!doctype html><html><body style="margin:0;background:#0b1220;font:13px system-ui;color:#e2e8f0">
<div style="padding:14px;display:flex;flex-direction:column;gap:6px">
  <div style="color:#94a3b8">改前 · 标题 ${OLD_FS}px / 箭头徽章 ${OLD_BADGE}px</div>
  <img id="a" style="display:block;width:1180px;border-radius:10px">
  <div style="color:#86efac;margin-top:12px">改后 · 标题 22px / 箭头徽章 18px</div>
  <img id="b" style="display:block;width:1180px;border-radius:10px">
</div></body></html>`);
await cmp.evaluate(([a, b]) => {
  document.getElementById('a').src = a;
  document.getElementById('b').src = b;
}, [b64(before), b64(after)]);
await cmp.waitForTimeout(600);
await cmp.screenshot({ path: `${OUT}/title-before-after.png`, fullPage: true });
console.log(`输出：${OUT}/title-before-after.png`);
await browser.close();
