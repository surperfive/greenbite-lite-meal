/**
 * 点餐头图：底色 / 圆角残留 的像素级核对（v2）
 *
 * 关键点：不能随便挑一个点当"背景色" —— 这张海报的左上和右侧都有半调白点阵，
 * 抽到点上就会得到白色。所以先对整张图做颜色直方图取主色，再拿主色去比对容器底色。
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
await page.waitForSelector('#menu-banner-image', { timeout: 8000 });

const geo = await page.evaluate(() => {
  const img = document.querySelector('#menu-banner-image');
  const wrap = document.querySelector('#menu-header-banner');
  const b = img.getBoundingClientRect();
  const w = wrap.getBoundingClientRect();
  return {
    img: { x: b.x, y: b.y, w: b.width, h: b.height, x2: b.x + b.width, y2: b.y + b.height },
    wrap: { x: w.x, y: w.y, w: w.width, h: w.height },
    wrapBg: getComputedStyle(wrap).backgroundColor,
    src: img.getAttribute('src'),
  };
});

/* 1) 源图本身：主色 + 四角扫描 */
const srcInfo = await page.evaluate(async (src) => {
  const im = new Image();
  im.src = src;
  await im.decode();
  const c = document.createElement('canvas');
  c.width = im.naturalWidth;
  c.height = im.naturalHeight;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(im, 0, 0);
  const W = c.width;
  const H = c.height;
  const data = ctx.getImageData(0, 0, W, H).data;

  // 主色直方图（量化到 4 的倍数，压掉抗锯齿噪点）
  const hist = new Map();
  for (let i = 0; i < data.length; i += 4 * 7) {
    const k = `${data[i] >> 2},${data[i + 1] >> 2},${data[i + 2] >> 2}`;
    hist.set(k, (hist.get(k) || 0) + 1);
  }
  const top = [...hist.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4)
    .map(([k, n]) => {
      const [r, g, b] = k.split(',').map((v) => Number(v) * 4);
      return { rgb: `rgb(${r},${g},${b})`, hex: '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join(''), px: n };
    });

  const px = (x, y) => {
    const i = (y * W + x) * 4;
    return `${data[i]},${data[i + 1]},${data[i + 2]}`;
  };
  // 左上角沿对角线走，找到第一个"绿"像素（g 明显大于 r）
  let radius = null;
  for (let d = 0; d < 80; d++) {
    const [r, g] = px(d, d).split(',').map(Number);
    if (g > 180 && r > 100) { radius = d; break; }
  }
  return {
    size: `${W}x${H}`,
    top,
    diagGreenStart: radius,
    corner5: { tl: px(2, 2), tr: px(W - 3, 2), bl: px(2, H - 3), br: px(W - 3, H - 3) },
    // 纯底色取样：中上、中下（都避开点阵与主体）
    plain: { 'mid-top': px(W >> 1, 12), 'mid-bottom': px(W >> 1, H - 12), 'left-mid': px(6, H >> 1) },
  };
}, geo.src);

/* 2) 渲染结果：容器竖切 + 四角 */
const buf = await page.screenshot();
const probe = await page.evaluate(async ({ shot, geo }) => {
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
  const cx = geo.img.x + geo.img.w / 2;
  return {
    dpr,
    column: {
      strip: S(cx, geo.wrap.y + 6),
      imgTop1: S(cx, geo.img.y + 1),
      imgTop6: S(cx, geo.img.y + 6),
    },
    corners: {
      tl1: S(geo.img.x + 1, geo.img.y + 1),
      tl2: S(geo.img.x + 2, geo.img.y + 2),
      tl4: S(geo.img.x + 4, geo.img.y + 4),
      tr1: S(geo.img.x2 - 1, geo.img.y + 1),
      bl1: S(geo.img.x + 1, geo.img.y2 - 1),
      br1: S(geo.img.x2 - 1, geo.img.y2 - 1),
    },
  };
}, { shot: 'data:image/png;base64,' + buf.toString('base64'), geo });

console.log(JSON.stringify({ geo, srcInfo, probe }, null, 2));
await browser.close();
