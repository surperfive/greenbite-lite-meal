/**
 * 指定区域 3× 放大导出（源图或清洗图都行），用来判断"淡色方块"是原图自带还是清洗引入
 * 用法：node scripts/crop-image.mjs <图片> <x> <y> <w> <h> <缩放> <输出>
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const [, , SRC, X, Y, W, H, Z, OUTP] = process.argv;
mkdirSync(dirname(OUTP), { recursive: true });
const b64in = readFileSync(SRC).toString('base64');

const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage();
await page.goto('about:blank');
const b64 = await page.evaluate(
  async ({ b64in, X, Y, W, H, Z }) => {
    const im = new Image();
    im.src = 'data:image/png;base64,' + b64in;
    await im.decode();
    const c = document.createElement('canvas');
    c.width = W * Z;
    c.height = H * Z;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(im, X, Y, W, H, 0, 0, W * Z, H * Z);
    return c.toDataURL('image/png').split(',')[1];
  },
  { b64in, X: +X, Y: +Y, W: +W, H: +H, Z: +Z }
);
writeFileSync(OUTP, Buffer.from(b64, 'base64'));
console.log('ok ' + OUTP);
await browser.close();
