import { chromium } from 'playwright';
import { BASE } from './_base.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 30000 }).catch(() => {});
await page.waitForFunction(() => {
  const s = document.getElementById('app-page-stage');
  return s && getComputedStyle(s).opacity === '1';
}, { timeout: 30000 });
await page.click('#nav-tab-orders');
await page.waitForFunction(() => {
  const s = document.getElementById('app-page-stage');
  return s && getComputedStyle(s).opacity === '1';
}, { timeout: 30000 });
await page.waitForTimeout(1000);
// 断言：胶囊文案已是「搜索」、页面无「发票」
const txt = await page.evaluate(() => ({
  hasInvoice: document.body.innerText.includes('发票'),
  hasSearchPill: [...document.querySelectorAll('button')].some(b => b.innerText.trim() === '搜索'),
}));
console.log('页面还有「发票」(应 false):', txt.hasInvoice, '| 有「搜索」胶囊(应 true):', txt.hasSearchPill);
// 点搜索胶囊 → 输入框应获得焦点
await page.getByRole('button', { name: '搜索' }).first().click();
await page.waitForTimeout(300);
const focused = await page.evaluate(() => document.activeElement?.tagName + ':' + (document.activeElement?.getAttribute('placeholder') || ''));
console.log('点击后焦点:', focused);
// 截搜索行
const row = await page.evaluate(() => {
  const input = document.querySelector('input[placeholder*="搜索菜品"]');
  const r = input.closest('div').parentElement.getBoundingClientRect();
  return { x: Math.max(0, r.x - 6), y: Math.max(0, r.y - 6), width: r.width + 12, height: r.height + 12 };
});
await page.screenshot({ path: 'scripts/_shots/orders-search-row.png', clip: row });
await browser.close();
