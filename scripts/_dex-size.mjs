import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const tag = process.argv[2] || 'before';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.click('#nav-tab-gacha');
await page.waitForTimeout(1500);
await page.click('#btn-header-info');
await page.waitForSelector('[role="dialog"]', { timeout: 4000 });
await page.waitForTimeout(900);
const m = await page.evaluate(() => {
  const card = document.getElementById('gacha-dex-modal');
  const c = card.getBoundingClientRect();
  const shell = document.querySelector('[data-app-stage-box]').getBoundingClientRect();
  const title = card.querySelector('h3').getBoundingClientRect();
  const btn = card.querySelector('button[class*="rounded-full"]');
  const rows = [...card.querySelectorAll('.gb-modal-scroll > div')];
  const r0 = rows[0].getBoundingClientRect();
  return {
    card: { w: +c.width.toFixed(1), h: +c.height.toFixed(1), top: +c.top.toFixed(1), bottom: +c.bottom.toFixed(1) },
    shell: { w: +shell.width.toFixed(1), h: +shell.height.toFixed(1), top: +shell.top.toFixed(1) },
    cardWOfShell: +(c.width / shell.width * 100).toFixed(1),
    titleFont: getComputedStyle(card.querySelector('h3')).fontSize,
    titleH: +title.height.toFixed(1),
    rowH: +r0.height.toFixed(1),
    rowFont: getComputedStyle(rows[0].querySelector('span')).fontSize,
    iconBox: +rows[0].querySelector('div.rounded-\\[9px\\]').getBoundingClientRect().height.toFixed(1),
  };
});
console.log(tag, JSON.stringify(m, null, 1));
const box = await page.evaluate(() => {
  const c = document.getElementById('gacha-dex-modal').getBoundingClientRect();
  return { x: c.x - 26, y: c.y - 30, width: c.width + 52, height: c.height + 60 };
});
await page.screenshot({ path: `scripts/_shots/dex-${tag}.png`, clip: box });
await browser.close();
