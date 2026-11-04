/**
 * 临时脚本：拼一张「改前（实心青柠）/ 改后（白底绿描边）」的对照图。
 */
import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
import fs from 'node:fs';

const OUT = 'scripts/_chipcmp';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  executablePath:
    'C:/Users/OOW/AppData/Local/ms-playwright/chromium-1148/chrome-win/chrome.exe',
});
const page = await browser.newPage({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 3 });
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(2600);
await page.keyboard.press('Escape').catch(() => {});
await page.getByText('点餐', { exact: true }).last().click({ timeout: 5000 }).catch(() => {});
await page.waitForTimeout(900);
await page.getByText('≤250大卡', { exact: true }).click({ timeout: 5000 });
await page.waitForTimeout(700);

const bar = page.locator('#filter-all-btn').locator('xpath=..');
await bar.screenshot({ path: `${OUT}/after.png` });

// 还原旧样式：实心青柠
await page.evaluate(() => {
  const chip = [...document.querySelectorAll('button')].find((b) => b.textContent.includes('≤250大卡'));
  chip.className = chip.className.replace(
    'bg-white text-[#26430B] border border-transparent ring-2 ring-[#C7F665] font-black shadow-2xs',
    'bg-[#C7F665] text-black border border-transparent font-black shadow-2xs',
  );
});
await page.waitForTimeout(300);
await bar.screenshot({ path: `${OUT}/before.png` });

await browser.close();

const html = `<!doctype html><meta charset="utf-8">
<style>body{margin:0;background:#fff;font-family:system-ui,"Noto Sans SC",sans-serif;padding:14px}
 h2{font-size:14px;margin:0 0 10px;color:#0f172a}
 .lb{font-size:12px;color:#64748b;margin:10px 0 4px}
 img{width:100%;display:block;border:1px solid #eef2f7;border-radius:8px}</style>
<h2>热量筛选·选中态：实心青柠 → 白底绿描边</h2>
<div class="lb">改前</div><img src="before.png">
<div class="lb">改后</div><img src="after.png">`;
fs.writeFileSync(`${OUT}/index.html`, html);

const b2 = await chromium.launch({
  executablePath:
    'C:/Users/OOW/AppData/Local/ms-playwright/chromium-1148/chrome-win/chrome.exe',
});
const p2 = await b2.newPage({ viewport: { width: 780, height: 420 }, deviceScaleFactor: 2 });
await p2.goto('file:///' + process.cwd().replace(/\\/g, '/') + `/${OUT}/index.html`);
await p2.waitForTimeout(300);
await p2.screenshot({ path: 'scripts/_chip-before-after.png', fullPage: true });
await b2.close();
console.log('ok');
