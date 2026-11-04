/** 圈中组件 改前(86/26/12, 无进度条) vs 改后(76/22/11 + 进度条) A/B。 */
import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const CLIP = { x: 16, y: 0, width: 400, height: 190 };
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 3 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.click('#nav-tab-me');
await page.waitForTimeout(1300);

await page.screenshot({ path: 'scripts/_shots/meb-after.png', clip: CLIP });

// 还原「改前」：头像 86×105 / 昵称 26 / 胶囊 12+px-3.5 / 无进度条 / 背景图居中裁切
await page.evaluate(() => {
  const img = document.querySelector('img[alt="我的页面头图Banner"]');
  const av = img.parentElement.parentElement.querySelector('img[src="/mascot-avatar-hd.svg"]').parentElement;
  av.style.height = '86px'; av.style.width = '105px';
  const h1 = document.querySelector('h1'); h1.style.fontSize = '26px';
  const bar = [...document.querySelectorAll('div')].find((d) => d.className.includes('h-[4px]') && d.className.includes('overflow-hidden'));
  bar.style.display = 'none';
  const pill = bar.previousElementSibling;
  pill.style.padding = '6px 14px'; pill.style.gap = '6px';
  pill.querySelector('span').style.fontSize = '12px';
  pill.querySelector('svg').style.width = '14px'; pill.querySelector('svg').style.height = '14px';
  img.style.objectPosition = 'right center';
});
await page.waitForTimeout(400);
await page.screenshot({ path: 'scripts/_shots/meb-before.png', clip: CLIP });
const h = await page.evaluate(() => document.querySelector('img[alt="我的页面头图Banner"]').closest('div.relative.overflow-hidden').getBoundingClientRect().height);
console.log('还原后 banner 高', h);
await browser.close();
