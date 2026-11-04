/** 确认测量时实际渲染的字体（Google Fonts 没加载的话，量出来的偏移是错的）。 */
import { chromium } from 'playwright';
import { BASE } from './_base.mjs';

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
const req = [];
page.on('requestfailed', (r) => req.push(`FAIL ${r.url().slice(0, 90)}`));
page.on('response', (r) => {
  if (r.url().includes('fonts.g')) req.push(`${r.status()} ${r.url().slice(0, 90)}`);
});
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.click('#nav-tab-menu');
await page.waitForTimeout(2500);

const info = await page.evaluate(async () => {
  await document.fonts.ready;
  const loaded = [...document.fonts].map((f) => `${f.family} ${f.weight} ${f.status}`);
  const el = [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === '外卖');
  const cs = el ? getComputedStyle(el) : null;
  return {
    families: loaded.slice(0, 12),
    total: loaded.length,
    checkJakarta: document.fonts.check('12px "Plus Jakarta Sans"'),
    checkNoto: document.fonts.check('12px "Noto Sans SC"'),
    checkNotoBold: document.fonts.check('800 12px "Noto Sans SC"'),
    computed: cs && { family: cs.fontFamily, size: cs.fontSize, weight: cs.fontWeight },
  };
});
console.log(JSON.stringify(info, null, 1));
console.log('--- font 请求 ---');
console.log(req.slice(0, 12).join('\n') || '(无)');
await browser.close();
