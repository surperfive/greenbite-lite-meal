import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const MODE = process.argv[2]==='ten'?'ten':'single';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
const errs=[]; p.on('pageerror',e=>errs.push(e.message));
p.on('console',m=>{ if(m.type()==='error') errs.push(m.text()); });
await p.goto(BASE, { waitUntil:'networkidle' });
await p.waitForTimeout(1500);
await p.locator('#nav-tab-gacha').click();
await p.waitForTimeout(1600);

const before = await p.locator('#unified-pantry-big-card .grid > div').count();
const beforeText = await p.locator('#unified-pantry-big-card h3').first().textContent();
await p.locator(MODE==='ten'?'#btn-gacha-ten':'#btn-gacha-single').click();

// 等到覆盖层出现、再等到它消失（动画播完）
await p.waitForSelector('#gacha-burst-overlay',{timeout:6000});
const t0=Date.now();
await p.waitForSelector('#gacha-burst-overlay',{state:'detached',timeout:9000});
const dur=Date.now()-t0;

await p.waitForTimeout(500);
const after = await p.locator('#unified-pantry-big-card .grid > div').count();
const afterText = await p.locator('#unified-pantry-big-card h3').first().textContent();
console.log(`【${MODE}】`);
console.log(`  覆盖层存活: ${dur}ms`);
console.log(`  食材库卡片: ${before} → ${after}`);
console.log(`  文案: 「${beforeText}」 → 「${afterText}」`);
console.log(`  错误: ${errs.length?errs.join(' | '):'无'}`);
await p.screenshot({ path:`probe-out/${MODE}-done.png` });
await b.close();
