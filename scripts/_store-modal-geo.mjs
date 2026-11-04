/**
 * 「选择门店」弹窗几何测量 + 截图。
 * 目的：确认卡片相对壳内容区的占比（宽 / 高），为「缩小弹窗」定档。
 * 用法：node scripts/_store-modal-geo.mjs
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';

const OUT = 'scripts/_shots';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 435, height: 700 }, deviceScaleFactor: 2 });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));

await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.waitForTimeout(700);

await page.click('[title="点击切换门店"]');
await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
await page.waitForTimeout(900);

const geo = await page.evaluate(() => {
  const dlg = document.querySelector('[role="dialog"]');
  const card = dlg.querySelector(':scope > div > div:nth-child(2)') || dlg.querySelector('div');
  const stage = document.getElementById('app-page-stage');
  const shell = stage?.parentElement;
  const r = (el) => {
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return { x: +b.x.toFixed(1), y: +b.y.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1), b: +b.bottom.toFixed(1) };
  };
  const cardRect = card?.getBoundingClientRect();
  return {
    viewport: { w: innerWidth, h: innerHeight },
    shell: r(shell),
    dialogBox: r(dlg),
    card: r(card),
    cardOverflowY: card ? card.scrollHeight > card.clientHeight + 1 : null,
    bodyScroll: (() => {
      const body = dlg.querySelector('.gb-modal-scroll');
      return body ? { clientH: body.clientHeight, scrollH: body.scrollHeight, scrolling: body.scrollHeight > body.clientHeight + 1 } : null;
    })(),
    cardRatio: cardRect ? { wPct: +(cardRect.width / (shell?.getBoundingClientRect().width || 1) * 100).toFixed(1), hPct: +(cardRect.height / innerHeight * 100).toFixed(1) } : null,
  };
});
console.log(JSON.stringify(geo, null, 2));

await page.screenshot({ path: `${OUT}/store-modal-geo-before.png` });
console.log('shot: store-modal-geo-before.png');
await browser.close();
