/** 验证作品集页面：图片是否都加载、布局是否正常，并出两张截图。 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const file = path.resolve('outputs/UI规范案例.html');
const url = 'file:///' + file.replace(/\\/g, '/').split('/').map(encodeURIComponent).join('/');

const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage({ viewport: { width: 1200, height: 1000 }, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: 'load' });
await page.waitForTimeout(1200);

const info = await page.evaluate(() => {
  const imgs = [...document.images];
  return {
    total: imgs.length,
    broken: imgs.filter((i) => !i.complete || i.naturalWidth === 0).map((i) => i.src.split('/').pop()),
    cases: document.querySelectorAll('.case').length,
    height: document.body.scrollHeight,
  };
});

await page.screenshot({ path: 'outputs/_case-top.png' });
await page.evaluate(() => window.scrollTo(0, 980));
await page.waitForTimeout(400);
await page.screenshot({ path: 'outputs/_case-mid.png' });

fs.writeFileSync('outputs/_casecheck.txt', JSON.stringify(info, null, 2), 'utf8');
await browser.close();
