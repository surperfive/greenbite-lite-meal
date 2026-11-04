import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 1 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.waitForTimeout(1000);
const info = await page.evaluate(() => {
  const banner = document.getElementById('menu-header-banner');
  const img = document.getElementById('menu-banner-image');
  const active = document.querySelector('#nav-tab-menu, [id^="nav-tab"]');
  const tabs = [...document.querySelectorAll('[id^="nav-tab"]')].map(b => ({ id: b.id, cls: b.className.includes('text-black') || b.className.includes('bg-white') ? 'ACTIVE?' : '' }));
  const br = banner?.getBoundingClientRect();
  return {
    bannerExists: !!banner,
    bannerRect: br ? { t: +br.top.toFixed(0), h: +br.height.toFixed(0), w: +br.width.toFixed(0) } : null,
    imgLoaded: img ? img.complete && img.naturalWidth > 0 : null,
    imgFilter: img ? getComputedStyle(img).filter : null,
    stageOpacity: getComputedStyle(document.getElementById('app-page-stage')).opacity,
    loaderPresent: !!document.querySelector('.brand-loader'),
    tabs,
    bodyBg: getComputedStyle(document.body).backgroundColor,
  };
});
console.log(JSON.stringify(info, null, 1));
await page.screenshot({ path: 'scripts/_shots/diag-full.png', fullPage: false });
await browser.close();
