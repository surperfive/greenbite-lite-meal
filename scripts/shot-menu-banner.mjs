/**
 * 点餐页头图：换图前后的尺寸 / 比例 / 边角颜色核对 + 顶部截图
 *
 * 用法：node scripts/shot-menu-banner.mjs [输出目录] [文件名后缀]
 *
 * 为什么要量：
 *  1. 旧头图是 SVG（2120×437，比例 4.85），新头图是 PNG（1024×283，比例 3.62）。
 *     `w-full h-auto` 下高度会跟着比例走，换图后 banner 会变高，需要知道具体影响多少。
 *  2. 新 PNG 是 colorType=2（无 alpha 通道），如果截图时做过圆角裁切，
 *     四个角会残留白色/黑底，摊在青柠底上就是四个明显的直角缺口 —— 直接量角像素确认。
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = process.env.BASE || 'http://127.0.0.1:5173/';
const OUT = process.argv[2] || 'outputs/menu-banner';
const TAG = process.argv[3] || 'now';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage({
  viewport: { width: 430, height: 932 },
  deviceScaleFactor: 3,
  locale: 'zh-CN',
});

await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#app-loading-screen', { state: 'detached', timeout: 25000 }).catch(() => {});
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(900);

// 默认落地页是「点餐」，但显式点一次更稳
await page.click('#nav-tab-menu').catch(() => {});
await page.waitForTimeout(800);

const info = await page.evaluate(() => {
  const img = document.querySelector('#menu-banner-image');
  const wrap = document.querySelector('#menu-header-banner');
  if (!img) return { error: 'no #menu-banner-image' };
  const ib = img.getBoundingClientRect();
  const wb = wrap.getBoundingClientRect();
  const cs = getComputedStyle(img);
  return {
    src: img.getAttribute('src'),
    natural: `${img.naturalWidth}x${img.naturalHeight}`,
    box: `${+ib.width.toFixed(1)}x${+ib.height.toFixed(1)}`,
    ratio: +(ib.width / ib.height).toFixed(3),
    wrapBox: `${+wb.width.toFixed(1)}x${+wb.height.toFixed(1)}`,
    wrapPadTop: getComputedStyle(wrap).paddingTop,
    wrapBg: getComputedStyle(wrap).backgroundColor,
    objectFit: cs.objectFit,
  };
});

// 角像素：把图丢进 canvas 采样，判断有没有被烘焙进白色圆角
const corners = await page.evaluate(async (src) => {
  const im = new Image();
  im.src = src;
  await im.decode().catch(() => {});
  const c = document.createElement('canvas');
  c.width = im.naturalWidth;
  c.height = im.naturalHeight;
  const ctx = c.getContext('2d');
  ctx.drawImage(im, 0, 0);
  const px = (x, y) => {
    const d = ctx.getImageData(x, y, 1, 1).data;
    return `${d[0]},${d[1]},${d[2]}`;
  };
  const W = c.width - 1;
  const H = c.height - 1;
  return {
    size: `${im.naturalWidth}x${im.naturalHeight}`,
    tl0: px(0, 0),
    tl4: px(4, 4),
    tl10: px(10, 10),
    tr0: px(W, 0),
    tr4: px(W - 4, 4),
    bl0: px(0, H),
    br0: px(W, H),
    centerLeft: px(2, Math.floor(H / 2)),
    center: px(Math.floor(W / 2), Math.floor(H / 2)),
  };
}, info.src);

await page.screenshot({ path: `${OUT}/${TAG}-top.png`, clip: { x: 0, y: 0, width: 430, height: 300 } });
await page.screenshot({ path: `${OUT}/${TAG}-full.png`, fullPage: false });

writeFileSync(`${OUT}/${TAG}.json`, JSON.stringify({ info, corners }, null, 2), 'utf8');
console.log(JSON.stringify({ info, corners }, null, 2));

await browser.close();
