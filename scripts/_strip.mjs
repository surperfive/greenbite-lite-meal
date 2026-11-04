import { chromium } from 'playwright';
import fs from 'fs';

const BASE = 'http://127.0.0.1:5173/';
const OUT = 'outputs/align2';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });

const tabs = ['menu', 'gacha', 'me', 'orders', 'home'];
for (const t of tabs) {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2700);
  if (t !== 'menu') {
    await page.click(`#nav-tab-${t}`, { force: true });
    await page.waitForTimeout(2500);
  }
  // 左边缘条带：0..140 CSS px，放大到 3 倍
  await page.screenshot({ path: `${OUT}/strip-${t}.png`, clip: { x: 0, y: 0, width: 140, height: 844 } });
  await page.screenshot({ path: `${OUT}/rstrip-${t}.png`, clip: { x: 250, y: 0, width: 140, height: 844 } });
}
await browser.close();
console.log('ok');
