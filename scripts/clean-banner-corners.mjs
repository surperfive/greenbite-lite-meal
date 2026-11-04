/**
 * 把点餐头图四个角的"深色圆角残留"洗掉，产出一张干净的 PNG。
 *
 * 背景：源图 1024×283 是 RGB 无 alpha 的截图，四角带着深色圆角底
 * （上两角近纯黑 0,0,4；下两角深灰 0x1E1F24），半径折算到 410px 展示宽度
 * 约 8.8 / 16 CSS px。直接铺在青柠底上就是四个小黑缺角。
 *
 * 做法：canvas 里先涂满海报自身的青柠 #ACE418，再用 roundRect 裁剪后把原图画进去，
 * 于是圆角外的深色像素被同色青柠覆盖 —— 看起来就是"海报本来没有圆角"。
 * 半径按量出来的实际深度 +2px 冗余，逐个角单独指定。
 *
 * 用法：node scripts/clean-banner-corners.mjs [源文件] [输出文件]
 *      源文件默认 public/ordering_header_banner.png，
 *      输出默认写入 public/ordering_header_banner.png（源图先备份到 outputs/）。
 */
import { chromium } from 'playwright';
import { copyFileSync, writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { basename } from 'node:path';

const SRC = process.argv[2] || 'public/ordering_header_banner.png';
const OUT = process.argv[3] || 'public/ordering_header_banner.png';
const BG = '#ACE418';
// 单位：源图像素。深色残留的外缘半径实测 tl/tr≈21、bl≈44、br≈36，
// ⚠️ 圆角半径必须**大于**这个值若干像素：等于的话裁剪边界正好压在深色外缘上，
//    抗锯齿会留一圈 1px 的深色描边（第一版 22 就踩了这个坑，放大后是一道黑弧）。
const R = { tl: 30, tr: 30, bl: 52, br: 46 };
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

// 源图备份（带时间戳目录，避免二次运行覆盖掉真·原始图）
mkdirSync('outputs/banner-src', { recursive: true });
copyFileSync(SRC, `outputs/banner-src/${basename(SRC, '.png')}.orig-${Date.now()}.png`);

const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage();
await page.goto('about:blank');

// 项目里没有 pngjs/sharp，PIL 也不在受管 Python 里 —— 浏览器 canvas 是现成的编解码器。
// 图片以 base64 注入，避免 dev server 的跨域 fetch。
const b64in = readFileSync(SRC).toString('base64');
const png = await page.evaluate(
  async ({ b64in, bg, R }) => {
    const im = new Image();
    im.src = 'data:image/png;base64,' + b64in;
    await im.decode();
    const W = im.naturalWidth;
    const H = im.naturalHeight;
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const ctx = c.getContext('2d');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    // Path2D.roundRect 支持逐角半径 [tl, tr, br, bl]
    const p = new Path2D();
    p.roundRect(0, 0, W, H, [R.tl, R.tr, R.br, R.bl]);
    ctx.save();
    ctx.clip(p);
    ctx.drawImage(im, 0, 0);
    ctx.restore();
    return c.toDataURL('image/png');
  },
  { b64in, bg: BG, R }
);

writeFileSync(OUT, Buffer.from(png.split(',')[1], 'base64'));
console.log(JSON.stringify({ src: SRC, out: OUT, bg: BG, radii: R }, null, 2));

await browser.close();
