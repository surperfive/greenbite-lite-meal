/**
 * 「立即购买」去黑边改阴影：改前 / 改后 对照图。
 * 输入：scripts/_buy/A-现状黑边硬影.png、Z-最终.png
 * 输出：scripts/_buy-before-after.png
 * 用法：node scripts/_buy-final.mjs
 */
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

const before = readFileSync('scripts/_buy/A-现状黑边硬影.png').toString('base64');
const after = readFileSync('scripts/_buy/Z-最终.png').toString('base64');

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  body{margin:0;background:#fff;font-family:-apple-system,"Segoe UI","Microsoft YaHei",sans-serif;color:#0f172a}
  .wrap{padding:18px}
  h2{font-size:14px;margin:0 0 2px;font-weight:800}
  p{font-size:11px;color:#64748b;margin:0 0 14px}
  .row{margin-bottom:16px}
  .tag{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:800;margin-bottom:6px}
  .dot{width:8px;height:8px;border-radius:50%}
  .bad .dot{background:#f43f5e}.good .dot{background:#65a30d}
  .bad .tag{color:#be123c}.good .tag{color:#4d7c0f}
  img{display:block;width:100%;border-radius:10px;border:1px solid #e2e8f0}
  .note{font-size:10.5px;color:#94a3b8;margin-top:4px}
</style></head><body><div class="wrap">
<h2>立即购买 · 去黑边改阴影</h2>
<p>2px 黑边 + 2px 硬投影 → 透明边框占位 + 青柠调软投影</p>
<div class="row bad"><div class="tag"><span class="dot"></span>改前：黑边勾死轮廓，硬投影像贴纸</div>
<img src="data:image/png;base64,${before}"></div>
<div class="row good"><div class="tag"><span class="dot"></span>改后：无描边，靠投影浮起</div>
<img src="data:image/png;base64,${after}"><div class="note">两个胶囊高度仍是 44px（透明边框占位，行高不变）</div></div>
</div></body></html>`;

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 900, height: 700 }, deviceScaleFactor: 2 });
await page.setContent(html, { waitUntil: 'load' });
await page.waitForTimeout(250);
await page.screenshot({ path: 'scripts/_buy-before-after.png', fullPage: true });
await browser.close();
console.log('ok');
