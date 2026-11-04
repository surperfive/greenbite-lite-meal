/** 身份条 46（旧）vs 42（新）A/B 截图。
 *  做法：先拍现在的 42，再用注入 CSS 把旧规格（46 那一版的所有尺寸）还原出来拍一张。
 *  输出 scripts/_shots/mb46.png / mb42.png，拼图交给 _member-bar-ab-sheet.py。 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';
const OUT = 'scripts/_shots';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 3 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.click('#nav-tab-home');
await page.waitForTimeout(1600);

const clipOf = async () =>
  page.evaluate(() => {
    const b = document.getElementById('home-member-bar').getBoundingClientRect();
    // 固定裁切高度 54，让两张图能直接对齐比较（不随卡高变化）
    const H = 54;
    const cy = (b.top + b.bottom) / 2;
    return { x: Math.max(0, b.x - 8), y: Math.max(0, cy - H / 2), width: b.width + 16, height: H };
  });

// ── A：现在的 42 ──
await page.screenshot({ path: `${OUT}/mb42.png`, clip: await clipOf() });

// ── B：还原 46 那一版的所有尺寸 ──
await page.addStyleTag({
  content: `
  #home-member-bar { min-height: 46px !important; border-radius: 22px !important; }
  #home-member-bar img { height: 28px !important; width: 28px !important; }
  #home-member-bar svg[viewBox="0 0 28 28"] { height: 14px !important; width: 14px !important;
    bottom: -2px !important; right: -2px !important; }
  #home-member-bar .truncate { font-size: 14.5px !important; }
  #home-member-bar .text-\\[\\#FDCF29\\] { font-size: 9.5px !important; padding: 3px 7px !important; }
  #home-member-bar .ml-auto { font-size: 9px !important; }
  #home-member-bar .mt-\\[5px\\].flex { height: 5px !important; margin-top: 6px !important; }
  #home-member-bar svg.lucide-chevron-right { height: 16px !important; width: 16px !important; }
  `,
});
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/mb46.png`, clip: await clipOf() });

const h = await page.evaluate(() => document.getElementById('home-member-bar').getBoundingClientRect().height);
console.log('还原后高度', h);
await browser.close();
