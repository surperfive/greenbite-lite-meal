/**
 * 「选择门店」弹窗缩小 A/B：对倾斜层打不同 scale，看视觉占比。
 * 用法：node scripts/_store-modal-scale-ab.mjs
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';

const OUT = 'scripts/_shots';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 435, height: 700 }, deviceScaleFactor: 2 });

await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
await page.waitForTimeout(700);

await page.click('[title="点击切换门店"]');
await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
await page.waitForTimeout(900);

const variants = [1, 0.94, 0.9, 0.86];

for (const s of variants) {
  const info = await page.evaluate((scale) => {
    const dlg = document.querySelector('[role="dialog"]');
    const tiltLayer = dlg.firstElementChild; // 倾斜层
    tiltLayer.style.transform = scale === 1 ? 'rotate(-1.6deg)' : `rotate(-1.6deg) scale(${scale})`;
    const card = tiltLayer.querySelector('div:nth-child(2)');
    const b = card.getBoundingClientRect();
    const shell = document.getElementById('app-page-stage').parentElement.getBoundingClientRect();
    return {
      visualW: +b.width.toFixed(1),
      visualH: +b.height.toFixed(1),
      sideGap: +((b.left - shell.left + shell.right - b.right) / 2).toFixed(1),
      topGap: +b.top.toFixed(1),
      bottomGap: +(shell.height - b.bottom).toFixed(1),
      wPct: +(b.width / shell.width * 100).toFixed(1),
    };
  }, s);
  await page.waitForTimeout(120);
  await page.screenshot({ path: `${OUT}/store-scale-${String(s).replace('.', '')}.png` });
  console.log(`scale ${s} →`, JSON.stringify(info));
}

await browser.close();
