/**
 * 生成「改前 / 改后」对照图（主粮基底三卡对齐）。
 * 输入：scripts/_bean/A-现状外扩.png、V1-主粮基底.png
 * 用法：node scripts/_bean-final.mjs
 */
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

const before = readFileSync('scripts/_bean/A-现状外扩.png').toString('base64');
const after = readFileSync('scripts/_bean/V1-主粮基底.png').toString('base64');

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  body{margin:0;background:#fff;font-family:-apple-system,"Segoe UI","Microsoft YaHei",sans-serif;color:#0f172a}
  .wrap{padding:18px 18px 22px}
  h2{font-size:14px;margin:0 0 2px;font-weight:800}
  p{font-size:11px;color:#64748b;margin:0 0 14px}
  .row{margin-bottom:18px}
  .tag{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:800;margin-bottom:6px}
  .dot{width:8px;height:8px;border-radius:50%}
  .bad .dot{background:#f43f5e}.good .dot{background:#65a30d}
  .bad .tag{color:#be123c}.good .tag{color:#4d7c0f}
  img{display:block;width:100%;border-radius:10px}
  .bad img{border:1px solid #fecdd3;background:#fff}
  .good img{border:1px solid #d9f99d;background:#fff}
  .note{font-size:10.5px;color:#94a3b8;margin-top:4px}
</style></head><body><div class="wrap">
<h2>主粮基底 · 选中卡对齐</h2>
<p>选中卡改用内描边（ring-inset），外轮廓与另外两张齐平</p>
<div class="row bad"><div class="tag"><span class="dot"></span>改前：青柠环画在边框外，第 3 张各方向胖 2px、顶出右内边距</div>
<img src="data:image/png;base64,${before}"><div class="note">描边外沿 x 278.0 → 400.7（容器右边线 400）</div></div>
<div class="row good"><div class="tag"><span class="dot"></span>改后：描边收进边框盒内侧，三张卡 border-box 完全一致</div>
<img src="data:image/png;base64,${after}"><div class="note">描边外沿 x 281.0 → 397.7，落在卡片内</div></div>
</div></body></html>`;

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 900, height: 800 }, deviceScaleFactor: 2 });
await page.setContent(html, { waitUntil: 'load' });
await page.waitForTimeout(300);
await page.screenshot({ path: 'scripts/_bean-align-before-after.png', fullPage: true });
await browser.close();
console.log('ok -> scripts/_bean-align-before-after.png');
