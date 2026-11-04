/** 验证导出的独立 svg 能脱离项目样式单独渲染 + 合并 svg 正常 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const DIR = 'exports/icon-set/icons';
const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.svg')).sort();

const html = `<!doctype html><html><head><meta charset="utf-8">
<style>
body{margin:0;background:#F4F6F8;font:11px ui-monospace,monospace}
.grid{display:grid;grid-template-columns:repeat(10,1fr);gap:10px;padding:20px;width:1500px}
.cell{background:#fff;border:1px solid #E6EAEE;border-radius:12px;padding:10px;text-align:center}
.cell img{height:34px;width:auto;display:block;margin:0 auto 6px}
.n{color:#556;font-size:9px;word-break:break-all;line-height:1.2}
</style></head><body>
<div class="grid">${files.map((f) => `<div class="cell"><img src="icons/${f}"><div class="n">${f.replace(/\.svg$/, '')}</div></div>`).join('')}</div>
</body></html>`;
fs.writeFileSync('exports/icon-set/_verify.html', html);

const fileUrl = (rel) => 'file:///' + path.resolve(rel).replace(/\\/g, '/').replace(/ /g, '%20').replace(/#/g, '%23');
const b = await chromium.launch({ channel: 'chrome' });
const p = await b.newPage({ viewport: { width: 1540, height: 900 }, deviceScaleFactor: 2 });
await p.goto(fileUrl('exports/icon-set/_verify.html'), { waitUntil: 'load' });
await p.waitForTimeout(700);
const broken = await p.evaluate(() => [...document.images].filter(i => !i.complete || i.naturalWidth === 0).map(i => i.getAttribute('src')));
const box = await p.evaluate(() => { const g = document.querySelector('.grid'); const r = g.getBoundingClientRect(); return { w: Math.ceil(r.width), h: Math.ceil(r.height) }; });
await p.setViewportSize({ width: 1540, height: box.h + 40 });
await p.waitForTimeout(200);
await p.screenshot({ path: 'scripts/_shots/verify-icons.png', fullPage: true });
console.log('独立文件', files.length, '个；加载失败:', JSON.stringify(broken));

// 合并 svg：套 html 用 <img> 打开
fs.writeFileSync('exports/icon-set/_verify2.html', `<!doctype html><html><body style="margin:0;background:#F4F6F8"><img src="图标合集.svg" style="display:block;width:1500px"></body></html>`);
await p.goto(fileUrl('exports/icon-set/_verify2.html'), { waitUntil: 'load' });
await p.waitForTimeout(500);
const ib = await p.evaluate(() => { const i = document.querySelector('img'); return { w: i.clientWidth, h: i.clientHeight, ok: i.naturalWidth > 0 }; });
await p.setViewportSize({ width: 1520, height: Math.ceil(ib.h) + 20 });
await p.waitForTimeout(200);
await p.screenshot({ path: 'scripts/_shots/verify-icons-combined.png', fullPage: true });
console.log('合并 svg', JSON.stringify(ib));
await b.close();
for (const f of ['exports/icon-set/_verify.html', 'exports/icon-set/_verify2.html']) if (fs.existsSync(f)) fs.unlinkSync(f);
