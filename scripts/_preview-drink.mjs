/**
 * 临时脚本：只调「羽衣甘蓝酸奶昔」(thumb #2) 的杯子位置/大小，一次拍四档方案，
 * 用来判断"往中间挪"到哪一档时右下角的弧文字还压不住。
 */
import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
import fs from 'node:fs';

const OUT = 'scripts/_drink';
fs.mkdirSync(OUT, { recursive: true });

const CASES = [
  { name: 'A-原版', x: -14, s: 0.84, y: -18.5 },
  { name: 'E-三等', x: -3, s: 0.78, y: -21 },
  { name: 'F-近中偏大', x: -1, s: 0.74, y: -21.5 },
  { name: 'D-居中', x: -1, s: 0.72, y: -22 },
];

const browser = await chromium.launch({
  executablePath:
    'C:/Users/OOW/AppData/Local/ms-playwright/chromium-1148/chrome-win/chrome.exe',
});
const page = await browser.newPage({
  viewport: { width: 420, height: 900 },
  deviceScaleFactor: 3,
});
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(2600);
await page.keyboard.press('Escape').catch(() => {});
await page.getByText('点餐', { exact: true }).last().click({ timeout: 5000 }).catch(() => {});
await page.waitForTimeout(1200);

const thumb = page.locator('[data-dish-thumb="true"]').nth(2);
await thumb.scrollIntoViewIfNeeded();

for (const c of CASES) {
  await page.evaluate(
    ({ x, s, y }) => {
      const t = document.querySelectorAll('[data-dish-thumb="true"]')[2];
      const img = t.children[0].children[1];
      // groupDy = 12
      img.style.transform = `translate(${x}%, ${y + 12}%) scale(${s})`;
    },
    c,
  );
  await page.waitForTimeout(120);
  await thumb.screenshot({ path: `${OUT}/${c.name}.png` });
}

await browser.close();

const html = `<!doctype html><meta charset="utf-8">
<style>
 body{margin:0;background:#fff;font-family:system-ui,"Noto Sans SC",sans-serif;padding:14px}
 h2{font-size:14px;margin:0 0 10px}
 .row{display:flex;gap:12px;align-items:flex-start}
 .cell{width:150px;text-align:center}
 .cell img{width:150px;height:150px;display:block;border-radius:8px;background:#f8fafc}
 .cap{font-size:11px;color:#475569;margin-top:4px}
</style>
<h2>羽衣甘蓝酸奶昔：杯子往中间的四档</h2>
<div class="row">
${CASES.map(
  (c) => `<div class="cell"><img src="${c.name}.png"><div class="cap">${c.name}</div></div>`,
).join('')}
</div>`;
fs.writeFileSync(`${OUT}/index.html`, html);

const b2 = await chromium.launch({
  executablePath:
    'C:/Users/OOW/AppData/Local/ms-playwright/chromium-1148/chrome-win/chrome.exe',
});
const p2 = await b2.newPage({ viewport: { width: 700, height: 260 }, deviceScaleFactor: 2 });
await p2.goto('file:///' + process.cwd().replace(/\\/g, '/') + `/${OUT}/index.html`);
await p2.waitForTimeout(300);
await p2.screenshot({ path: 'scripts/_drink-compare.png', fullPage: true });
await b2.close();
console.log('ok');
