/**
 * 9折限时徽章：无旋转隔离台架截图 + 白墨迹逐行量测
 * 目的：验证 ① 皇冠已全白（无深色像素）② 皇冠墨迹中心 == 文字墨迹中心
 * 用法：node scripts/_badge-iso-shot.mjs
 * 说明：裁剪区只取气泡内部（左右各让 6、上下各让 4 用户单位），
 *       避开白胶囊与圆角；台架无 rotate，垂直基准唯一。
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const OUT = 'scripts/_shots';
fs.mkdirSync(OUT, { recursive: true });
const file = 'file:///' + path.resolve('scripts/_badge-iso.html').replace(/\\/g, '/');

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 760, height: 360 }, deviceScaleFactor: 2 });
await page.goto(file, { waitUntil: 'load' });
await page.waitForTimeout(300);

// 屏幕坐标换算：viewBox 620,10 180x80 → 720x320，scale = 4
const S = 4, OX = 620, OY = 10;
const u = (x, y) => ({ sx: (x - OX) * S, sy: (y - OY) * S });

const boxes = await page.evaluate(() => {
  const r = (id) => {
    const b = document.getElementById(id).getBoundingClientRect();
    return { x: b.x, y: b.y, w: b.width, h: b.height };
  };
  return { bubble: r('badge-bubble'), crown: r('badge-crown'), text: r('txt-discount') };
});
console.log('BOXES(css)', JSON.stringify(boxes));

// 气泡可视内部：x 637.5~783.5 / y 25~66（项目标定），再各让 2
const inner = { x: 639.5, y: 27, w: 142, h: 37 };
const p1 = u(inner.x, inner.y);
const clip = { x: p1.sx, y: p1.sy, width: inner.w * S, height: inner.h * S };
await page.screenshot({ path: `${OUT}/iso-badge-inner.png`, clip });

// 皇冠条 / 文字条分别裁，宽度各留 2 单位余量
const strip = (x0, x1) => {
  const a = u(x0, inner.y);
  return { x: a.sx, y: a.sy, width: (x1 - x0) * S, height: inner.h * S };
};
await page.screenshot({ path: `${OUT}/iso-crown.png`, clip: strip(644, 674) });
await page.screenshot({ path: `${OUT}/iso-text.png`, clip: strip(679, 772) });
await page.screenshot({ path: `${OUT}/iso-full.png`, clip: { x: 0, y: 0, width: 720, height: 320 } });

console.log('clip(inner)', JSON.stringify(clip));
await browser.close();
