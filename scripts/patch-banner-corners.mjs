/**
 * 点餐头图四角修复：镜像补砖（不用纯色覆盖，避免出现"色块"）
 *
 * 源图 1024×283 是 RGB 无 alpha 的截图，四角带深色圆角底（左上/右上近黑，左下/右下 #1E1F24）。
 *
 * 试过三种做法：
 *  ① 圆角外刷成青柠纯色 → 刷出来的平涂面积比黑角本身大得多，盖在白点阵上变成"色块不对"（用户否掉）。
 *  ② 放大 10% + overflow-hidden 裁边 → 没有色块，但左右各吃掉 18 CSS px，海报左边的笑脸涂鸦被切掉半个。
 *  ③ 镜像补砖（本脚本）：把角落方块以自身为镜面翻折，用紧挨着的内侧像素填进来。
 *     点阵是均匀格点，镜像后节奏不变；平涂的色块感完全没有，也不损失任何画面内容。
 *
 * 半径取"深色外缘 + 2px"（源图像素），四角实测不一致：左上≈33、右上≈21、左下≈44、右下≈36。
 *
 * 用法：node scripts/patch-banner-corners.mjs [源] [输出]
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, copyFileSync, mkdirSync } from 'node:fs';
import { basename } from 'node:path';

const SRC = process.argv[2] || 'outputs/banner-src/ordering_header_banner.orig-1793169154751.png';
const OUT = process.argv[3] || 'public/ordering_header_banner.png';
const R = { tl: 35, tr: 23, bl: 46, br: 38 };
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

mkdirSync('outputs/banner-src', { recursive: true });
copyFileSync(SRC, `outputs/banner-src/${basename(SRC, '.png')}.bak-${Date.now()}.png`);

const b64in = readFileSync(SRC).toString('base64');
const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage();
await page.goto('about:blank');

const png = await page.evaluate(
  async ({ b64in, R }) => {
    const im = new Image();
    im.src = 'data:image/png;base64,' + b64in;
    await im.decode();
    const W = im.naturalWidth;
    const H = im.naturalHeight;
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const ctx = c.getContext('2d');
    ctx.drawImage(im, 0, 0);

    // 以角落方块的"内边线"为镜面双向翻折：dest = (2m - src)。
    // ⚠️ 两个轴必须同时翻：只翻一个轴、平移量却按另一个角算，dest 会跑到负坐标，
    //    整块被裁掉变成透明（第一版就这么错的）。
    const patch = (x, y, r) => {
      const mx = x === 0 ? r : W - r;
      const my = y === 0 ? r : H - r;
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, r, r);
      ctx.clip();
      ctx.translate(2 * mx, 2 * my);
      ctx.scale(-1, -1);
      ctx.drawImage(im, 0, 0);
      ctx.restore();
    };

    patch(0, 0, R.tl);
    patch(W - R.tr, 0, R.tr);
    patch(0, H - R.bl, R.bl);
    patch(W - R.br, H - R.br, R.br);

    return c.toDataURL('image/png');
  },
  { b64in, R }
);

writeFileSync(OUT, Buffer.from(png.split(',')[1], 'base64'));
console.log(JSON.stringify({ src: SRC, out: OUT, radii: R }));
await browser.close();
