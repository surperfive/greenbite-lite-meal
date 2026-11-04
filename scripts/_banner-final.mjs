/**
 * 首页「限时超值福利」条：46px → 40px 前后对照。
 * 用法：node scripts/_banner-final.mjs
 */
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

const before = readFileSync('scripts/_banner/A-46px.png').toString('base64');
const after = readFileSync('scripts/_banner/Z-40px.png').toString('base64');

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
<h2>限时超值福利 · 胶囊条高度</h2>
<p>46px → 40px，条内元素同步收一档，比例不变</p>
<div class="row bad"><div class="tag"><span class="dot"></span>改前 46px</div>
<img src="data:image/png;base64,${before}"><div class="note">圆徽章 28 · 标题 15px · LIMITED TIME 9px · 按钮 20.5</div></div>
<div class="row good"><div class="tag"><span class="dot"></span>改后 40px</div>
<img src="data:image/png;base64,${after}"><div class="note">圆徽章 24 · 标题 14px · LIMITED TIME 8px · 按钮 19</div></div>
</div></body></html>`;

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 900, height: 600 }, deviceScaleFactor: 2 });
await page.setContent(html, { waitUntil: 'load' });
await page.waitForTimeout(250);
await page.screenshot({ path: 'scripts/_banner-before-after.png', fullPage: true });
await browser.close();
console.log('ok');
