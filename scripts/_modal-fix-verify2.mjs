import { chromium } from 'playwright';
import { BASE } from './_base.mjs';

async function probe(vp, label, breakDvh = false) {
  const browser = await chromium.launch({ channel: 'chrome' });
  const page = await browser.newPage({ viewport: vp, deviceScaleFactor: 1 });
  await page.goto(BASE, { waitUntil: 'commit' });
  await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
  await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
  await page.waitForTimeout(500);
  if (breakDvh) {
    // 模拟不支持 dvh 的旧内核：强制壳高 auto（内容撑高）
    await page.addStyleTag({ content: '.shell-h-safe{height:auto!important}.shell-maxh-safe{max-height:none!important}' });
    await page.waitForTimeout(300);
  }
  await page.click('#nav-tab-gacha');
  await page.waitForTimeout(1200);
  await page.click('#btn-header-info');
  await page.waitForSelector('[role="dialog"]', { timeout: 4000 });
  await page.waitForTimeout(700);
  const m = await page.evaluate(() => {
    const d = document.querySelector('[role="dialog"]').getBoundingClientRect();
    return {
      card: { t: +d.top.toFixed(0), b: +d.bottom.toFixed(0), h: +d.height.toFixed(0) },
      vh: innerHeight,
      outAbove: +Math.max(0, -d.top).toFixed(1),
      outBelow: +Math.max(0, d.bottom - innerHeight).toFixed(1),
    };
  });
  console.log(label, JSON.stringify(m));
  await browser.close();
}

await probe({ width: 430, height: 932 }, 'A-normal-932     ');
await probe({ width: 514, height: 1242 }, 'B-tall-1242     ');
await probe({ width: 514, height: 700 }, 'C-short-700     ');
await probe({ width: 414, height: 774 }, 'D-mini-414x774  ');
await probe({ width: 414, height: 774 }, 'E-mini-dvh-broken', true);
