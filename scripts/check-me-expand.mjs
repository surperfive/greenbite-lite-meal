import { chromium } from 'playwright';
import fs from 'node:fs';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2600);
await page.getByRole('button', { name: '我的' }).first().click();
await page.waitForTimeout(600);

const expand = page.getByText('展开全部', { exact: true }).first();
await expand.click();

// 采样高度曲线
const samples = [];
for (let i = 0; i < 10; i++) {
  const h = await page.evaluate(() => {
    const el = document.getElementById('me-more-features');
    return el ? Math.round(el.getBoundingClientRect().height) : -1;
  });
  samples.push(h);
  await page.waitForTimeout(50);
}
await page.waitForTimeout(500);
const finalH = await page.evaluate(() => {
  const el = document.getElementById('me-more-features');
  return el ? Math.round(el.getBoundingClientRect().height) : -1;
});
const items = await page.evaluate(() => {
  const el = document.getElementById('me-more-features');
  return el ? [...el.querySelectorAll('button')].map((b) => b.innerText.replace(/\s+/g, '')) : [];
});

// 收起，再采样一次
await page.getByText('收起', { exact: true }).first().click();
const collapse = [];
for (let i = 0; i < 8; i++) {
  const h = await page.evaluate(() => {
    const el = document.getElementById('me-more-features');
    return el ? Math.round(el.getBoundingClientRect().height) : -1;
  });
  collapse.push(h);
  await page.waitForTimeout(50);
}

await page.screenshot({ path: 'outputs/me-expand-check.png', fullPage: false });

fs.writeFileSync(
  'check-expand.txt',
  [
    `expand heights: ${samples.join(', ')}`,
    `final height: ${finalH}`,
    `items: ${items.join(' | ')}`,
    `collapse heights: ${collapse.join(', ')}`,
    `errors: ${errors.length ? errors.join(' | ') : 'none'}`,
  ].join('\n'),
  'utf8'
);

await browser.close();
