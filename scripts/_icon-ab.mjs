// A/B：热量筛选胶囊里「火焰图标」相对文字上下挪多少才对齐
// 只做视觉对比：同一行渲染 4 档，4× 截图后拼一张
import { chromium } from 'playwright';
import { BASE } from './_base.mjs';

const LEVELS = [0, -0.5, -1, -1.5, -2];

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 4 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });

// 给筛选行容器 + 火焰图标打标记
const ok = await page.evaluate(() => {
  const anchor = document.getElementById('filter-all-btn');
  if (!anchor) return 'no anchor';
  let row = anchor.parentElement;
  for (let i = 0; i < 4 && row && row !== document.body; i++) {
    if (row.querySelectorAll('button').length >= 3) break;
    row = row.parentElement;
  }
  row.id = 'ia-row';
  // 三个热量胶囊里的 svg 就是火焰
  let n = 0;
  for (const btn of row.querySelectorAll('button')) {
    const svg = btn.querySelector('svg');
    if (svg && /大卡/.test(btn.textContent)) { svg.classList.add('ia-flame'); n++; }
  }
  return `row tagged, flames=${n}`;
});
console.log(ok);

// 等入场动画彻底停下再量（白卡是滑入的，早量会把裁切框量到海报上）
await page.waitForTimeout(1500);

// 固定裁切框：只量一次，后面每档都用同一块（避免 locator 自动滚动）
const box = await page.evaluate(() => {
  const r = document.getElementById('ia-row').getBoundingClientRect();
  return { x: Math.max(0, r.left - 2), y: Math.max(0, r.top - 2), width: Math.min(r.width + 4, innerWidth - r.left), height: r.height + 4 };
});
console.log('clip', JSON.stringify(box));

for (const dy of LEVELS) {
  await page.evaluate((d) => {
    document.getElementById('ab-style')?.remove();
    const s = document.createElement('style');
    s.id = 'ab-style';
    s.textContent = `.ia-flame{transform:translateY(${d}px)}`;
    document.head.appendChild(s);
  }, dy);
  await page.waitForTimeout(160);
  await page.screenshot({ path: `scripts/_shots/_icon-ab-${String(dy).replace('.', 'p')}.png`, clip: box });
}

await page.evaluate(() => { document.getElementById('ab-style')?.remove(); });
await browser.close();
console.log(LEVELS.map((d) => `scripts/_shots/_icon-ab-${String(d).replace('.', 'p')}.png`).join('\n'));
