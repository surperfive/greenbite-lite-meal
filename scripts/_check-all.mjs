/** 验证总览页：路径能解析、视频能加载、布局正常。 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const file = path.resolve('outputs/动效总览.html');
const url = 'file:///' + file.replace(/\\/g, '/').split('/').map(encodeURIComponent).join('/');

const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
const errs = [];
page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));

await page.goto(url, { waitUntil: 'load' });
await page.waitForTimeout(2500);

const info = await page.evaluate(() => {
  const vids = [...document.querySelectorAll('video')];
  return {
    title: document.title,
    videoCount: vids.length,
    // 抽查首尾两个视频能否拿到时长
    first: vids[0] ? { readyState: vids[0].readyState, duration: Math.round(vids[0].duration * 10) / 10 } : null,
    last: vids.length ? { readyState: vids[vids.length - 1].readyState, duration: Math.round(vids[vids.length - 1].duration * 10) / 10 } : null,
    sections: document.querySelectorAll('.group').length,
    cards: document.querySelectorAll('.card').length,
    bodyH: document.body.scrollHeight,
  };
});

await page.screenshot({ path: 'outputs/_allshot-top.png' });
await page.evaluate(() => window.scrollTo(0, 700));
await page.waitForTimeout(600);
await page.screenshot({ path: 'outputs/_allshot-mid.png' });

fs.writeFileSync('outputs/_allcheck.txt', JSON.stringify({ ...info, errs }, null, 2), 'utf8');
await browser.close();
