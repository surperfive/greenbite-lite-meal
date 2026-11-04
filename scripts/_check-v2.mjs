/** 验证作品集页面 v2：8 个案例、图片全加载，并出两张截图。 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const file = path.resolve('outputs/UI规范案例.html');
const url = 'file:///' + file.replace(/\\/g, '/').split('/').map(encodeURIComponent).join('/');

const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage({ viewport: { width: 1200, height: 1000 }, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: 'load' });
await page.waitForTimeout(1500);

const info = await page.evaluate(() => {
  const imgs = [...document.images];
  return {
    images: imgs.length,
    broken: imgs.filter((i) => !i.complete || i.naturalWidth === 0).map((i) => i.src.split('/').pop()),
    cases: document.querySelectorAll('.case').length,
    height: document.body.scrollHeight,
  };
});

const target = await page.evaluate(() => {
  const c = document.querySelectorAll('.case')[5];
  return c ? c.getBoundingClientRect().top + window.scrollY : 0;
});
await page.evaluate((y) => window.scrollTo(0, y - 20), target);
await page.waitForTimeout(500);
await page.screenshot({ path: 'outputs/_v2-a.png' });
await page.evaluate(() => window.scrollBy(0, 900));
await page.waitForTimeout(400);
await page.screenshot({ path: 'outputs/_v2-b.png' });

fs.writeFileSync('outputs/_v2check.txt', JSON.stringify(info, null, 2), 'utf8');
await browser.close();
