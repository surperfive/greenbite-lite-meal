/** hero 背景提亮：三档 filter 参数并排（只改 DOM，不动源码）。 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';
const OUT = 'scripts/_shots';
fs.mkdirSync(OUT, { recursive: true });

const VARIANTS = [
  ['A 当前 1.42/0.92/1.06', 'brightness(1.42) contrast(0.92) saturate(1.06)'],
  ['B 1.30/0.98/1.12', 'brightness(1.30) contrast(0.98) saturate(1.12)'],
  ['C 1.55/0.88/1.04', 'brightness(1.55) contrast(0.88) saturate(1.04)'],
];

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
await page.route('**/fonts.googleapis.com/**', (r) => r.abort());
await page.route('**/fonts.gstatic.com/**', (r) => r.abort());
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.waitForTimeout(900);
const card = page.locator('text=希腊酸奶杯').first();
await card.evaluate((el) => el.scrollIntoView({ block: 'center' })).catch(() => {});
await page.waitForTimeout(400);
await card.click({ timeout: 4000 }).catch(() => {});
await page.waitForSelector('h1', { timeout: 8000 }).catch(() => {});
await page.waitForTimeout(2200);

const clip = await page.evaluate(() => {
  const img = [...document.querySelectorAll('img')].find((i) => /unsplash|backdrops/.test(i.currentSrc || i.src));
  const b = img.getBoundingClientRect();
  return { x: Math.max(0, b.x), y: Math.max(0, b.y), width: Math.min(430, b.width), height: Math.min(232, b.height) };
});

for (const [i, [name, filter]] of VARIANTS.entries()) {
  await page.evaluate((f) => {
    const img = [...document.querySelectorAll('img')].find((x) => /unsplash|backdrops/.test(x.currentSrc || x.src));
    img.style.filter = f;
  }, filter);
  await page.waitForTimeout(350);
  await page.screenshot({ path: `${OUT}/hero-var-${'ABC'[i]}.png`, clip });
  console.log('variant', 'ABC'[i], name);
}
await browser.close();
