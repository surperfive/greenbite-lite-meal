/**
 * 订单卡顶部渐变范围：改前 / 改后 对照图。
 * 输入：scripts/_wash/A-现状64px.png、Z-最终.png
 * 输出：scripts/_wash-before-after.png
 * 用法：node scripts/_order-wash-final.mjs
 */
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

const before = readFileSync('scripts/_wash/A-现状64px.png').toString('base64');
const after = readFileSync('scripts/_wash/Z-最终.png').toString('base64');

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
<h2>订单卡顶部青柠渐变 · 收缩范围</h2>
<p>渐变色标不变，只把高度从 64px 收到 44px</p>
<div class="row bad"><div class="tag"><span class="dot"></span>改前 h-16 / 64px：绿味漫到菜品缩略图那一行</div>
<img src="data:image/png;base64,${before}"><div class="note">渐变下沿一直拖到「牛油果鸡胸沙拉」标题下方</div></div>
<div class="row good"><div class="tag"><span class="dot"></span>改后 h-11 / 44px：收在门店名这一行下沿</div>
<img src="data:image/png;base64,${after}"><div class="note">菜品行恢复纯白底，缩略图和价格不再被绿底压色</div></div>
</div></body></html>`;

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 900, height: 700 }, deviceScaleFactor: 2 });
await page.setContent(html, { waitUntil: 'load' });
await page.waitForTimeout(250);
await page.screenshot({ path: 'scripts/_wash-before-after.png', fullPage: true });
await browser.close();
console.log('ok');
