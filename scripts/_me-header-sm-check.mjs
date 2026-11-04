/** 验证 `sm:` 在宽视口下是否生效（壳内禁用 sm: 的既有约定）。 */
import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
for (const vw of [430, 1400]) {
  const page = await browser.newPage({ viewport: { width: vw, height: 932 }, deviceScaleFactor: 1 });
  await page.goto(BASE, { waitUntil: 'commit' });
  await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
  await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
  await page.click('#nav-tab-me');
  await page.waitForTimeout(1200);
  const r = await page.evaluate(() => {
    const img = document.querySelector('img[alt="我的页面头图Banner"]');
    const banner = img.closest('div.relative.overflow-hidden');
    const cs = getComputedStyle(banner);
    const av = document.querySelector('img[src="/mascot-avatar-hd.svg"]').parentElement;
    const b = banner.getBoundingClientRect();
    return { h: +b.height.toFixed(1), pt: cs.paddingTop, pb: cs.paddingBottom, avatarH: +av.getBoundingClientRect().height.toFixed(1) };
  });
  console.log('viewport', vw, JSON.stringify(r));
  await page.close();
}
await browser.close();
