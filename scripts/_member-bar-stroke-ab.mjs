/** 身份条「浅色描边」三档 A/B（只改 DOM 的 boxShadow，不动源码）。
 *  背景是两段拼的：上半压绿海报、下半压浅灰页面底 —— 白描边在下半会"消失"，
 *  浅青柠描边两种底上都还在，所以必须两段都看。 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';
const OUT = 'scripts/_shots';
fs.mkdirSync(OUT, { recursive: true });

const VARIANTS = [
  ['none', null],
  ['white2', '0 0 0 2px #FFFFFF, 0 4px 16px rgba(0,0,0,0.10)'],
  ['lime50', '0 0 0 2px #F2FCE0, 0 4px 16px rgba(0,0,0,0.10)'],
];

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 4 });
await page.route('**/fonts.googleapis.com/**', (r) => r.abort());
await page.route('**/fonts.gstatic.com/**', (r) => r.abort());
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.waitForTimeout(900);
await page.click('#nav-tab-home', { timeout: 4000 }).catch(() => {});
await page.waitForSelector('#home-member-bar', { timeout: 8000 });
await page.waitForTimeout(1800);

const clip = await page.evaluate(() => {
  const b = document.getElementById('home-member-bar').getBoundingClientRect();
  return { x: b.x - 8, y: b.y - 26, width: b.width + 16, height: b.height + 40 };
});

for (const [tag, shadow] of VARIANTS) {
  await page.evaluate((s) => {
    const el = document.getElementById('home-member-bar');
    el.style.boxShadow = s ?? '0 4px 16px rgba(0,0,0,0.10)';
  }, shadow);
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${OUT}/mb-stroke-${tag}.png`, clip });
  console.log(tag, 'ok');
}
await browser.close();
