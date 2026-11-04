/** 验证导出的独立 svg 能脱离项目样式单独渲染 + 合并 svg 正常 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const DIR = 'exports/brand-marks/marks';
const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.svg')).sort();

// ⚠️ _verify.html 就写在 exports/brand-marks/ 下，所以路径是 marks/xxx 而不是 ../marks/xxx
const html = `<!doctype html><html><head><meta charset="utf-8">
<style>
body{margin:0;background:#F4F6F8;font:12px ui-monospace,monospace}
.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;padding:24px;width:1400px}
.cell{background:#fff;border:1px solid #E6EAEE;border-radius:14px;padding:14px;text-align:center}
.cell img{height:120px;width:auto;max-width:100%;object-fit:contain;display:block;margin:0 auto 10px}
.n{color:#334;font-size:11px;word-break:break-all}
</style></head><body>
<div class="grid">${files.map((f) => `<div class="cell"><img src="marks/${f}"><div class="n">${f}</div></div>`).join('')}</div>
</body></html>`;
fs.writeFileSync('exports/brand-marks/_verify.html', html);

const b = await chromium.launch({ channel: 'chrome' });
const p = await b.newPage({ viewport: { width: 1448, height: 900 }, deviceScaleFactor: 2 });
const fileUrl = (rel) => 'file:///' + path.resolve(rel).replace(/\\/g, '/').replace(/ /g, '%20').replace(/#/g, '%23');

await p.goto(fileUrl('exports/brand-marks/_verify.html'), { waitUntil: 'load' });
await p.waitForTimeout(700);
const broken = await p.evaluate(() => [...document.images].filter(i => !i.complete || i.naturalWidth === 0).map(i => i.getAttribute('src')));
await p.screenshot({ path: 'scripts/_shots/verify-marks.png', fullPage: true });
console.log('独立文件', files.length, '个；加载失败:', JSON.stringify(broken));

// 合并 svg：套一层 html 用 <img> 打开，直接 goto svg 文档截不了图
const h2 = `<!doctype html><html><body style="margin:0;background:#F4F6F8"><img src="标志合集.svg" style="display:block;width:1500px"></body></html>`;
fs.writeFileSync('exports/brand-marks/_verify2.html', h2);
await p.setViewportSize({ width: 1520, height: 900 });
await p.goto(fileUrl('exports/brand-marks/_verify2.html'), { waitUntil: 'load' });
await p.waitForTimeout(600);
const box = await p.evaluate(() => { const i = document.querySelector('img'); return { w: i.clientWidth, h: i.clientHeight, ok: i.naturalWidth > 0 }; });
await p.setViewportSize({ width: 1520, height: Math.ceil(box.h) + 20 });
await p.waitForTimeout(200);
await p.screenshot({ path: 'scripts/_shots/verify-combined.png', fullPage: true });
console.log('合并 svg', JSON.stringify(box));
await b.close();
// 临时验证页不留在交付目录里
for (const f of ['exports/brand-marks/_verify.html', 'exports/brand-marks/_verify2.html']) {
  if (fs.existsSync(f)) fs.unlinkSync(f);
}
