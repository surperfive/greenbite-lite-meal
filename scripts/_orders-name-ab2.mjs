/** A/B2：每个菜名独占一行（不折断词） vs 现状 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';
const OUT = 'scripts/_shots';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });

// 方案 E：每个菜一行
{
  const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
  await page.goto(BASE, { waitUntil: 'commit' });
  await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
  await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
  await page.waitForTimeout(500);
  await page.click('#nav-tab-orders');
  await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(900);
  await page.evaluate(() => {
    const p = [...document.querySelectorAll('p')].find(x => x.textContent.includes('牛油果鸡胸沙拉'));
    p.className = 'text-[13px] font-black text-black leading-tight tracking-tight whitespace-pre-line';
    p.textContent = '牛油果鸡胸沙拉 ×1\n金枪鱼三明治 ×1';
  });
  const m = await page.evaluate(() => {
    const p = [...document.querySelectorAll('p')].find(x => x.textContent.includes('牛油果鸡胸沙拉'));
    return { clientW: p.clientWidth, scrollW: p.scrollWidth, clientH: p.clientHeight, h: +p.getBoundingClientRect().height.toFixed(1) };
  });
  console.log('E 每菜一行', JSON.stringify(m));
  const box = await page.evaluate(() => {
    const p = [...document.querySelectorAll('p')].find(x => x.textContent.includes('牛油果鸡胸沙拉'));
    const card = p.closest('div.rounded-2xl') || p.parentElement.parentElement.parentElement;
    const r = card.getBoundingClientRect();
    return { x: Math.max(0,r.x-4), y: Math.max(0,r.y-4), width: Math.min(430-r.x+4,r.width+8), height: Math.min(932-r.y+4,r.height+8) };
  });
  await page.screenshot({ path: `${OUT}/ab2-name-E.png`, clip: box });
  await page.close();
}

// 方案 F：每菜一行 + 12px（更紧凑）
{
  const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
  await page.goto(BASE, { waitUntil: 'commit' });
  await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(() => {});
  await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 20000 });
  await page.waitForTimeout(500);
  await page.click('#nav-tab-orders');
  await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(900);
  await page.evaluate(() => {
    const p = [...document.querySelectorAll('p')].find(x => x.textContent.includes('牛油果鸡胸沙拉'));
    p.className = 'text-[12px] font-black text-black leading-tight tracking-tight whitespace-pre-line';
    p.textContent = '牛油果鸡胸沙拉 ×1\n金枪鱼三明治 ×1';
  });
  const m = await page.evaluate(() => {
    const p = [...document.querySelectorAll('p')].find(x => x.textContent.includes('牛油果鸡胸沙拉'));
    return { clientW: p.clientWidth, scrollW: p.scrollWidth, clientH: p.clientHeight, h: +p.getBoundingClientRect().height.toFixed(1) };
  });
  console.log('F 每菜一行 12px', JSON.stringify(m));
  const box = await page.evaluate(() => {
    const p = [...document.querySelectorAll('p')].find(x => x.textContent.includes('牛油果鸡胸沙拉'));
    const card = p.closest('div.rounded-2xl') || p.parentElement.parentElement.parentElement;
    const r = card.getBoundingClientRect();
    return { x: Math.max(0,r.x-4), y: Math.max(0,r.y-4), width: Math.min(430-r.x+4,r.width+8), height: Math.min(932-r.y+4,r.height+8) };
  });
  await page.screenshot({ path: `${OUT}/ab2-name-F.png`, clip: box });
  await page.close();
}
await browser.close();
