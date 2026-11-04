/**
 * 量插图占比：在每张卡的右下区域里找「非背景色」像素包围盒，
 * 换算成占卡宽/卡高的百分比，用来和参考图对齐。
 * 用法：node scripts/measure-entry-cards.mjs
 */
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 400, height: 300 } });
await page.setContent('<!doctype html><html><body></body></html>');

const measure = async (src, cards, tag) => {
  const b64 = `data:image/png;base64,${readFileSync(src).toString('base64')}`;
  const res = await page.evaluate(async ([s, cards]) => {
    const img = await new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = s; });
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, img.width, img.height).data;
    const W = img.width;
    const out = [];
    for (const k of cards) {
      // 只在右下角搜：x > 0.30w，y > 0.22h（避开标题/副标题；标签块在更左）
      let minX = 1e9, minY = 1e9, maxX = -1, maxY = -1;
      for (let y = Math.round(k.y + k.h * 0.22); y < k.y + k.h; y++) {
        for (let x = Math.round(k.x + k.w * 0.30); x < k.x + k.w; x++) {
          const i = (y * W + x) * 4;
          const r = d[i], gg = d[i + 1], b = d[i + 2];
          // 背景 = 白 或 青柠系（G 高、R 中高、B 低）
          const white = r > 243 && gg > 243 && b > 243;
          const lime = gg > 220 && b < 190 && r > 180;
          if (!white && !lime) {
            if (x < minX) minX = x; if (x > maxX) maxX = x;
            if (y < minY) minY = y; if (y > maxY) maxY = y;
          }
        }
      }
      out.push({
        name: k.name,
        leftPct: +((minX - k.x) / k.w * 100).toFixed(1),
        rightPct: +((k.x + k.w - 1 - maxX) / k.w * 100).toFixed(1),
        topPct: +((minY - k.y) / k.h * 100).toFixed(1),
        bottomPct: +((k.y + k.h - 1 - maxY) / k.h * 100).toFixed(1),
        wPct: +((maxX - minX + 1) / k.w * 100).toFixed(1),
        hPct: +((maxY - minY + 1) / k.h * 100).toFixed(1),
      });
    }
    return out;
  }, [b64, cards]);
  console.log(`\n== ${tag} ==`);
  for (const r of res) {
    console.log(
      `${r.name.padEnd(8)} 左${String(r.leftPct).padStart(5)}% 右${String(r.rightPct).padStart(5)}% 上${String(r.topPct).padStart(5)}% 下${String(r.bottomPct).padStart(5)}%  → 宽${r.wPct}% 高${r.hPct}%`
    );
  }
};

// 参考图（596×445，卡 287×205 / 278×205 / 287×206 / 278×206）
await measure('outputs/entry-ref.png', [
  { name: 'takeout', x: 12, y: 13, w: 287, h: 205 },
  { name: 'pickup', x: 310, y: 13, w: 278, h: 205 },
  { name: 'benefit', x: 12, y: 231, w: 287, h: 206 },
  { name: 'gacha', x: 310, y: 231, w: 278, h: 206 },
], '参考图');

// 本应用截图：390 CSS 宽网格 @3x = 1170；卡 192、间距 6
const S = 3;
await measure('outputs/entry-compare/cards-app.png', [
  { name: 'takeout', x: 0, y: 0, w: 192 * S, h: 125 * S },
  { name: 'pickup', x: (192 + 6) * S, y: 0, w: 192 * S, h: 125 * S },
  { name: 'benefit', x: 0, y: (125 + 8) * S, w: 192 * S, h: 125 * S },
  { name: 'gacha', x: (192 + 6) * S, y: (125 + 8) * S, w: 192 * S, h: 125 * S },
], '本应用');

await browser.close();
