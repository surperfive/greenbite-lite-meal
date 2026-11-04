/**
 * 量海报四个角"深色残留"的实际范围（源图像素 → CSS 像素）
 * 背景：这张 1024×283 的 PNG 是 RGB 无 alpha 的，四角带有深色圆角底（上黑下深灰）。
 * 摊在青柠底上就是四个小黑角，必须用 border-radius 把它们裁掉。
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE || 'http://127.0.0.1:5173/';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, locale: 'zh-CN' });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('#app-loading-screen', { state: 'detached', timeout: 25000 }).catch(() => {});
await page.waitForTimeout(600);
await page.click('#nav-tab-menu').catch(() => {});
await page.waitForTimeout(600);

const out = await page.evaluate(async () => {
  const img = document.querySelector('#menu-banner-image');
  const im = new Image();
  im.src = img.getAttribute('src');
  await im.decode();
  const c = document.createElement('canvas');
  c.width = im.naturalWidth;
  c.height = im.naturalHeight;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(im, 0, 0);
  const W = c.width;
  const H = c.height;
  const data = ctx.getImageData(0, 0, W, H).data;
  const dark = (x, y) => {
    const i = (y * W + x) * 4;
    // "深色" = 三通道都很暗（黑角 0,0,4 / 下角 30,31,36 都命中）
    return data[i] < 70 && data[i + 1] < 70 && data[i + 2] < 70;
  };

  const scan = (corner) => {
    const R = 80;
    let maxIn = 0; // 深色像素侵入的最深距离（沿单轴）
    const rowIn = []; // 每一行的侵入深度，用来反推半径
    for (let y = 0; y < R; y++) {
      let deepest = -1;
      for (let x = 0; x < R; x++) {
        const px = corner.includes('l') ? x : W - 1 - x;
        const py = corner.includes('t') ? y : H - 1 - y;
        if (dark(px, py)) deepest = x;
      }
      if (deepest >= 0) {
        maxIn = Math.max(maxIn, deepest);
        rowIn.push(deepest);
      }
    }
    return { maxDepth: maxIn + 1, firstRows: rowIn.slice(0, 6) };
  };

  const cssPerSrc = 410 / W;
  const res = {};
  for (const k of ['tl', 'tr', 'bl', 'br']) {
    const s = scan(k);
    res[k] = { ...s, espCss: +(s.maxDepth * cssPerSrc).toFixed(2) };
  }
  return { size: `${W}x${H}`, cssPerSrc: +cssPerSrc.toFixed(4), corners: res };
});

console.log(JSON.stringify(out, null, 2));
await browser.close();
