/**
 * 量三处颜色，判断换图后到底哪几处会出现"两种青柠拼在一起"的接缝：
 *   1) 设备框（视口左右各 10px 的留白）    → 帧底色
 *   2) 头图容器 14px 上留白（pt-3.5）      → 容器底色
 *   3) 海报自身的底色                      → 图片底色
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE || 'http://127.0.0.1:5173/';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2, locale: 'zh-CN' });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#app-loading-screen', { state: 'detached', timeout: 25000 }).catch(() => {});
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(900);
await page.click('#nav-tab-menu').catch(() => {});
await page.waitForTimeout(800);

const buf = await page.screenshot();
const out = await page.evaluate(async ({ shot }) => {
  const im = new Image();
  im.src = shot;
  await im.decode();
  const dpr = im.naturalWidth / window.innerWidth;
  const c = document.createElement('canvas');
  c.width = im.naturalWidth;
  c.height = im.naturalHeight;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(im, 0, 0);
  const S = (x, y) => {
    const d = ctx.getImageData(Math.round(x * dpr), Math.round(y * dpr), 1, 1).data;
    return `rgb(${d[0]},${d[1]},${d[2]})`;
  };
  return {
    dpr,
    'frame-left-mid': S(3, 60),
    'frame-right-mid': S(427, 60),
    'strip-top': S(215, 4),
    'strip-top2': S(215, 10),
    'img-inside': S(215, 60),
    'below-banner-left': S(215, 130),
  };
}, { shot: 'data:image/png;base64,' + buf.toString('base64') });

console.log(JSON.stringify(out, null, 2));
await browser.close();
