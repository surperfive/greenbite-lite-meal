/**
 * 临时脚本：把「点餐页封面下移前 / 后」拍成对照图。
 * 现状 = 源码里的 groupDy（当前 8），"原来" = 在 DOM 上再减 4 还原成旧值。
 */
import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
import fs from 'node:fs';

const OUT = 'scripts/_cmp';
fs.mkdirSync(OUT, { recursive: true });

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

const shiftAll = async (d) => {
  await page.evaluate((delta) => {
    document.querySelectorAll('[data-dish-thumb="true"]').forEach((thumb) => {
      const art = thumb.children[0];
      const [plate, img, svg] = art.children;
      const top = parseFloat(plate.style.top);
      plate.style.top = `${top + delta}%`;
      img.style.transform = img.style.transform.replace(
        /translate\(([-\d.]+)%, ([-\d.]+)%\)/,
        (_, x, y) => `translate(${x}%, ${parseFloat(y) + delta}%)`,
      );
      const ty = parseFloat(svg.style.transform.match(/-?[\d.]+/)[0]);
      svg.style.transform = `translateY(${ty + delta}%)`;
    });
  }, d);
};

const thumbs = page.locator('[data-dish-thumb="true"]');
const n = await thumbs.count();
const names = [];
for (let i = 0; i < n; i++) {
  await thumbs.nth(i).scrollIntoViewIfNeeded();
  await page.waitForTimeout(120);
  await thumbs.nth(i).screenshot({ path: `${OUT}/after-${i}.png` });
  names.push(await thumbs.nth(i).locator('xpath=..').locator('h4').innerText().catch(() => `dish-${i}`));
}

// 全部回到旧值（-4）
await shiftAll(-4);
for (let i = 0; i < n; i++) {
  await thumbs.nth(i).scrollIntoViewIfNeeded();
  await page.waitForTimeout(120);
  await thumbs.nth(i).screenshot({ path: `${OUT}/before-${i}.png` });
}

await browser.close();

// 拼一张对照图
const html = `<!doctype html><meta charset="utf-8">
<style>
  body{margin:0;background:#fff;font-family:system-ui,"Noto Sans SC",sans-serif;padding:16px}
  h2{font-size:15px;margin:0 0 12px}
  .row{display:flex;gap:16px;align-items:center;margin-bottom:18px}
  .cell{width:150px}
  .cell img{width:150px;height:150px;display:block;border-radius:8px;background:#f8fafc}
  .cap{font-size:11px;color:#64748b;margin-top:4px;text-align:center}
  .name{font-size:12px;font-weight:700;width:110px;color:#0f172a}
</style>
<h2>点餐页封面：整组再下移一档（8 → 12）</h2>
${names
  .map(
    (nm, i) => `<div class="row"><div class="name">${nm}</div>
    <div class="cell"><img src="before-${i}.png"><div class="cap">上一版 8</div></div>
    <div class="cell"><img src="after-${i}.png"><div class="cap">现在 12</div></div></div>`,
  )
  .join('')}`;
fs.writeFileSync(`${OUT}/compare.html`, html);

const b2 = await chromium.launch({
  executablePath:
    'C:/Users/OOW/AppData/Local/ms-playwright/chromium-1148/chrome-win/chrome.exe',
});
const p2 = await b2.newPage({ viewport: { width: 520, height: 900 }, deviceScaleFactor: 2 });
await p2.goto('file:///' + process.cwd().replace(/\\/g, '/') + `/${OUT}/compare.html`);
await p2.waitForTimeout(400);
await p2.screenshot({ path: 'scripts/_cover-compare.png', fullPage: true });
await b2.close();
console.log('done', names.join(' | '));
