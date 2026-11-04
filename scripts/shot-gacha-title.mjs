import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
import { mkdirSync } from 'node:fs';

const OUT = process.argv[2] ?? 'outputs/gacha-title';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 3 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForTimeout(800);

await page.click('#nav-tab-gacha');
await page.waitForTimeout(1200);
await page.click('#btn-header-tokens');
await page.waitForTimeout(1000);

const h3 = page.locator('h3', { hasText: '获取抽卡币' }).first();
const info = await h3.evaluate((el) => {
  const cs = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  const parent = el.parentElement.getBoundingClientRect();
  return {
    fontSize: cs.fontSize,
    letterSpacing: cs.letterSpacing,
    tracking: cs.letterSpacing,
    shadow: cs.textShadow,
    rect: { x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) },
    parent: { x: +parent.x.toFixed(1), w: +parent.width.toFixed(1), right: +parent.right.toFixed(1) },
    scrollW: el.scrollWidth,
  };
});
console.log(JSON.stringify(info, null, 1));

const box = await h3.boundingBox();
await page.screenshot({
  path: `${OUT}/title.png`,
  clip: { x: box.x - 10, y: box.y - 10, width: box.width + 20, height: box.height + 46 },
});
await page.screenshot({ path: `${OUT}/modal.png` });
await browser.close();
