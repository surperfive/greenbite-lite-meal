import { chromium } from 'playwright';
import { BASE } from './_base.mjs';

async function probe(vp) {
  const browser = await chromium.launch({ channel: 'chrome' });
  const page = await browser.newPage({ viewport: vp, deviceScaleFactor: 1 });
  await page.goto(BASE, { waitUntil: 'commit' });
  await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
  await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
  await page.waitForTimeout(800);
  // 打开门店弹窗：点餐页头部门店入口（找含「切换」或门店名的按钮）
  const opened = await page.evaluate(() => {
    // 优先找 header 里的门店按钮
    const cands = [...document.querySelectorAll('button')];
    const b = cands.find(el => /切换|门店/.test(el.textContent || ''));
    if (b) { b.click(); return (b.textContent || '').trim().slice(0, 30); }
    return null;
  });
  await page.waitForTimeout(900);
  const m = await page.evaluate(() => {
    const dlg = document.querySelector('[role="dialog"]');
    const backdrop = dlg ? dlg.parentElement : null;
    const shell = document.querySelector('#app-page-stage')?.closest('.max-w-\\[410px\\]')
      || document.querySelector('.max-w-\\[410px\\]');
    const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { t: +b.top.toFixed(1), b: +b.bottom.toFixed(1), l: +b.left.toFixed(1), r: +b.right.toFixed(1), h: +b.height.toFixed(1), w: +b.width.toFixed(1) }; };
    return { dialog: r(dlg), backdrop: r(backdrop), shell: r(shell), vh: innerHeight, vw: innerWidth };
  });
  console.log(JSON.stringify({ vp, opened, ...m }));
  await browser.close();
}

await probe({ width: 514, height: 851 });
await probe({ width: 430, height: 700 });
