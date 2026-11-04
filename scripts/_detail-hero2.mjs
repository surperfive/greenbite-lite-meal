/** 详情页 hero 截图（不依赖「大杯」文案，按关键字点卡） */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';
const kw = process.argv[2] ?? '照烧';
const OUT = 'scripts/_shots';
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 3 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.waitForTimeout(800);
const ok = await page.evaluate((k) => {
  const t = [...document.querySelectorAll('[data-dish-thumb="true"]')].find((x) =>
    x.closest('.group')?.querySelector('h4')?.textContent?.includes(k));
  const card = t?.closest('.group');
  if (!card) return false;
  card.scrollIntoView({ block: 'center' });
  card.click();
  return true;
}, kw);
if (!ok) { console.log('没找到', kw); process.exit(1); }
await page.waitForTimeout(1500);
const box = await page.evaluate(() => {
  const imgs = [...document.querySelectorAll('img')].filter((i) => i.src.includes('/dishes/'));
  let best = null;
  for (const img of imgs) {
    const r = img.getBoundingClientRect();
    if (!best || r.width * r.height > best.width * best.height) best = { x: r.x, y: r.y, width: r.width, height: r.height };
  }
  if (!best) return null;
  return { x: best.x - 16, y: best.y - 16, width: best.width + 32, height: best.height + 32 };
});
console.log('hero box', box);
await page.screenshot({ path: `${OUT}/detail-hero-${kw}.png`, clip: box });
await browser.close();
