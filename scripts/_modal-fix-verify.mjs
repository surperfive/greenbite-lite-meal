import { chromium } from 'playwright';
import { BASE } from './_base.mjs';

async function probe(vp, label) {
  const browser = await chromium.launch({ channel: 'chrome' });
  const page = await browser.newPage({ viewport: vp, deviceScaleFactor: 1 });
  await page.goto(BASE, { waitUntil: 'commit' });
  await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
  await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
  await page.waitForTimeout(500);
  const out = { label, vp };
  // 图鉴弹窗（用户报告的那个）
  await page.click('#nav-tab-gacha');
  await page.waitForTimeout(1200);
  await page.click('#btn-header-info');
  await page.waitForSelector('[role="dialog"]', { timeout: 4000 });
  await page.waitForTimeout(700);
  out.dex = await page.evaluate(() => {
    const d = document.querySelector('[role="dialog"]').getBoundingClientRect();
    const shell = document.querySelector('[data-app-stage-box]').getBoundingClientRect();
    return { card: { t: +d.top.toFixed(0), b: +d.bottom.toFixed(0) }, shell: { t: +shell.top.toFixed(0), b: +shell.bottom.toFixed(0) }, overflowBelow: +Math.max(0, d.bottom - shell.bottom).toFixed(1), overflowAbove: +Math.max(0, shell.top - d.top).toFixed(1) };
  });
  await page.keyboard.press('Escape');
  const x = await page.$('[role="dialog"] button[aria-label="关闭"]');
  if (x) await x.click();
  await page.waitForTimeout(400);
  // 门店弹窗回归
  await page.click('#nav-tab-menu');
  await page.waitForTimeout(700);
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find(el => /切换|门店/.test(el.textContent || ''));
    b?.click();
  });
  await page.waitForSelector('[role="dialog"]', { timeout: 4000 });
  await page.waitForTimeout(600);
  out.store = await page.evaluate(() => {
    const d = document.querySelector('[role="dialog"]').getBoundingClientRect();
    const shell = document.querySelector('[data-app-stage-box]').getBoundingClientRect();
    return { card: { t: +d.top.toFixed(0), b: +d.bottom.toFixed(0) }, shell: { t: +shell.top.toFixed(0), b: +shell.bottom.toFixed(0) }, overflowBelow: +Math.max(0, d.bottom - shell.bottom).toFixed(1) };
  });
  console.log(JSON.stringify(out));
  await browser.close();
}

await probe({ width: 430, height: 932 }, 'normal-932');
await probe({ width: 514, height: 1242 }, 'tall-1242');
