import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';
fs.mkdirSync('scripts/_shots', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
for (const [name, vp] of [['tall', { width: 430, height: 932 }], ['short', { width: 435, height: 700 }]]) {
  const page = await browser.newPage({ viewport: vp, deviceScaleFactor: 2 });
  await page.goto(BASE, { waitUntil: 'commit' });
  await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
  await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
  await page.waitForTimeout(700);
  await page.click('[title="点击切换门店"]');
  await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
  await page.waitForTimeout(900);
  await page.screenshot({ path: `scripts/_shots/store-090-${name}.png` });
  console.log('shot', name);
  await page.close();
}
await browser.close();
