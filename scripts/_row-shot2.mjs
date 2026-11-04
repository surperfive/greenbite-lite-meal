import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';
const OUT = 'scripts/_shots/rows2';
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 4 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });

const grabRow = async (name, matcher) => {
  const box = await page.evaluate(matcher);
  if (!box) { console.log('miss', name); return; }
  await page.screenshot({ path: `${OUT}/${name}.png`, clip: box });
  console.log(name, JSON.stringify(box));
};

await page.click('#nav-tab-orders');
await page.waitForTimeout(1000);
await grabRow('tabs', () => {
  const el = [...document.querySelectorAll('div')].find((e) => {
    const t = e.textContent.replace(/\s+/g, '');
    const r = e.getBoundingClientRect();
    return t.includes('进行中') && t.includes('已完成') && r.height > 20 && r.height < 60 && r.width > 200;
  });
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left - 6, y: r.top - 8, width: r.width + 12, height: r.height + 16 };
});

await page.click('#nav-tab-menu');
await page.waitForTimeout(1000);
await grabRow('cardtags', () => {
  const el = [...document.querySelectorAll('div')].find((e) => {
    const t = e.textContent.replace(/\s+/g, '');
    const r = e.getBoundingClientRect();
    return /\d\.\d折/.test(t) && t.includes('生酮友好') && r.height > 10 && r.height < 40 && r.width > 150;
  });
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left - 6, y: r.top - 10, width: r.width + 12, height: r.height + 20 };
});
await browser.close();
