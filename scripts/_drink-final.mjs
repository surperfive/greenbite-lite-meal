import { chromium } from 'playwright';
import fs from 'node:fs';

const html = `<!doctype html><meta charset="utf-8">
<style>
 body{margin:0;background:#fff;font-family:system-ui,"Noto Sans SC",sans-serif;padding:16px}
 h2{font-size:15px;margin:0 0 12px;color:#0f172a}
 .row{display:flex;gap:20px}
 .cell{width:170px;text-align:center}
 .cell img{width:170px;height:170px;display:block;border-radius:10px;background:#f8fafc;border:1px solid #eef2f7}
 .cap{font-size:12px;color:#64748b;margin-top:6px}
</style>
<h2>羽衣甘蓝酸奶昔：杯子往中间挪</h2>
<div class="row">
  <div class="cell"><img src="_drink/A-原版.png"><div class="cap">原来的（偏左）</div></div>
  <div class="cell"><img src="_drink/F-近中偏大.png"><div class="cap">现在的（居中）</div></div>
</div>`;
fs.writeFileSync('scripts/_drink-final.html', html);

const b = await chromium.launch({
  executablePath:
    'C:/Users/OOW/AppData/Local/ms-playwright/chromium-1148/chrome-win/chrome.exe',
});
const p = await b.newPage({ viewport: { width: 420, height: 260 }, deviceScaleFactor: 2 });
await p.goto('file:///' + process.cwd().replace(/\\/g, '/') + '/scripts/_drink-final.html');
await p.waitForTimeout(300);
await p.screenshot({ path: 'scripts/_drink-final.png', fullPage: true });
await b.close();
console.log('ok');
