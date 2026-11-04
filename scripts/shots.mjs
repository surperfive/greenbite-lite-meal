import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
import fs from 'node:fs'; import path from 'node:path';
const OUT='probe-out'; fs.mkdirSync(OUT,{recursive:true});
const MODE=process.argv[2]==='ten'?'ten':'single';
const b = await chromium.launch();
// DPR=1 截图快很多，减少时序漂移
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
await p.goto(BASE, { waitUntil: 'networkidle' });
await p.waitForTimeout(1500);
await p.locator('#nav-tab-gacha').click();
await p.waitForTimeout(1600);
await p.locator(MODE==='ten'?'#btn-gacha-ten':'#btn-gacha-single').click();
await p.waitForSelector('#gacha-burst-overlay');

// 用页面内定时器冻结在指定时刻截图：先设好 delay 再触发
// 更稳的做法：连续截图，事后按时序挑选
const marks=[150,400,600,900,1400,1900];
const t0=Date.now(); let idx=0;
const real=[];
while (Date.now()-t0 < 2100) {
  const t=Date.now()-t0;
  if (idx<marks.length && t>=marks[idx]) {
    await p.screenshot({ path: path.join(OUT, `${MODE}-t${marks[idx]}.png`) });
    real.push({ mark: marks[idx], actual: Date.now()-t0 });
    idx++;
  }
  await p.waitForTimeout(25);
}
console.log('截图时刻(计划/实际):', JSON.stringify(real));
await p.waitForTimeout(800);
await p.screenshot({ path: path.join(OUT, `${MODE}-final.png`) });
await b.close();
