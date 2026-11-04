/** 身份条内「昵称」与「等级胶囊文字」的基线是否还对齐。 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';
const OUT = 'scripts/_shots';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 4 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.click('#nav-tab-home');
await page.waitForTimeout(1200);
const bar = page.locator('#home-member-bar');
await bar.scrollIntoViewIfNeeded();
await page.waitForTimeout(300);
const box = await bar.boundingBox();
await page.screenshot({ path: `${OUT}/memberbar-el.png`, clip: box });
const info = await page.evaluate(() => {
  const bar = document.querySelector('#home-member-bar');
  const sp = [...bar.querySelectorAll('span')];
  const name = sp.find((s) => s.className.includes('truncate') && s.textContent.trim().length > 1);
  const lvl = sp.find((s) => s.textContent.trim().startsWith('黄金'));
  const r = (e) => { const b = e.getBoundingClientRect(); return { top: +b.top.toFixed(2), h: +b.height.toFixed(2) }; };
  return { name: name ? { ...r(name), t: name.textContent.trim(), cls: name.className.slice(0, 60) } : null,
           lvl: lvl ? { ...r(lvl), t: lvl.textContent.trim(), cls: lvl.className.slice(0, 60) } : null };
});
console.log(JSON.stringify(info, null, 1));
console.log('box', box);
await browser.close();
