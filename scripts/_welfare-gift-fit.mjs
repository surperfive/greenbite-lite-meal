/** 礼盒翻转右移后：确认没有被画布/壳裁切，且与关闭钮、标题的实际几何关系。 */
import { chromium } from 'playwright';
import { BASE } from './_base.mjs';

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 1 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('#nav-tab-home', { timeout: 20000 });
await page.waitForTimeout(800);
await page.click('#nav-tab-home');
await page.waitForSelector('#home-benefit-card', { timeout: 8000 });
await page.waitForTimeout(700);
await page.click('#home-benefit-card');
await page.waitForSelector('#welfare-center-stage', { timeout: 5000 });
await page.waitForTimeout(900);

const r = await page.evaluate(() => {
  const R = (s) => {
    const el = document.querySelector(s);
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return { x: +b.x.toFixed(1), y: +b.y.toFixed(1), r: +b.right.toFixed(1), b: +b.bottom.toFixed(1) };
  };
  const stage = document.querySelector('#welfare-center-stage');
  const svg = document.querySelector('.wf-gift svg');
  const bb = svg.getBBox ? svg.getBoundingClientRect() : null;
  return {
    stage: R('#welfare-center-stage'),
    board: R('.wf-board'),
    giftBox: R('.wf-gift'),
    giftSvg: bb && { x: +bb.x.toFixed(1), y: +bb.y.toFixed(1), r: +bb.right.toFixed(1), b: +bb.bottom.toFixed(1) },
    close: R('.wf-close'),
    title: R('.wf-title-group'),
    overflowOfStage: stage ? getComputedStyle(stage).overflow : null,
    shell: (() => { const b = document.getElementById('app-page-stage').parentElement.getBoundingClientRect(); return { x: b.x, r: b.right }; })(),
  };
});
console.log(JSON.stringify(r, null, 2));
await browser.close();
