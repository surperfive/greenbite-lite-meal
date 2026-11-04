import { chromium } from 'playwright';
import fs from 'node:fs';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
// 跳过开屏
await page.waitForTimeout(2600);
await page.getByRole('button', { name: '我的' }).first().click();
await page.waitForTimeout(700);
// 展开全部
const expand = page.getByText('展开全部', { exact: true });
if (await expand.count()) await expand.first().click();
await page.waitForTimeout(600);
await page.screenshot({ path: 'outputs/me-page-check.png', fullPage: true });

const bodyText = await page.evaluate(() => document.body.innerText);
fs.writeFileSync(
  'check-me.txt',
  [
    `has 食材溯源: ${bodyText.includes('食材溯源')}`,
    `has 环保减碳: ${bodyText.includes('环保减碳')}`,
    `has 开屏动画: ${bodyText.includes('开屏动画')}`,
    `has 营养档案: ${bodyText.includes('营养档案')}`,
    `has 隐私协议: ${bodyText.includes('隐私协议')}`,
    `texts: ${bodyText.replace(/\s+/g, ' ').slice(0, 600)}`,
    `errors: ${errors.length ? errors.join(' | ') : 'none'}`,
  ].join('\n'),
  'utf8'
);

await browser.close();
console.log('ok');
