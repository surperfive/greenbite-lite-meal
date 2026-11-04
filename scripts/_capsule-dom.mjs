import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#nav-tab-home', { timeout: 20000 });
await page.waitForTimeout(2400);
const info = await page.evaluate(() => {
  const stage = document.getElementById('app-page-stage');
  const caps = document.querySelectorAll('#mp-capsule').length;
  const firstChild = stage?.firstElementChild;
  return {
    url: location.href,
    capsuleCount: caps,
    stageChildren: stage ? stage.children.length : -1,
    head: firstChild ? firstChild.outerHTML.slice(0, 900) : null,
  };
});
console.log(info.url, 'capsule=', info.capsuleCount, 'stageChildren=', info.stageChildren);
console.log(info.head);
await browser.close();
