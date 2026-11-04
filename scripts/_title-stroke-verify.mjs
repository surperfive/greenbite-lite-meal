/** 验证：标题已无 text-shadow，且其它共用 StickerModal 的弹窗标题未变丑 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BASE } from './_base.mjs';
const OUT = 'scripts/_shots';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });

// 1) 抽卡页 → 食材图鉴
{
  const page = await browser.newPage({ viewport: { width: 410, height: 900 }, deviceScaleFactor: 4 });
  await page.goto(BASE, { waitUntil: 'commit' });
  await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 25000 }).catch(()=>{});
  await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 25000 }).catch(()=>{});
  await page.waitForTimeout(400);
  await page.click('#nav-tab-gacha');
  await page.waitForTimeout(1200);
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find(b => (b.getAttribute('title')||'').includes('食材图鉴'));
    btn?.click();
  });
  await page.waitForTimeout(1500);
  const r = await page.evaluate(() => {
    const card = document.getElementById('gacha-dex-modal');
    const h3 = card?.querySelector('h3');
    if (!h3) return null;
    const cs = getComputedStyle(h3);
    const b = h3.getBoundingClientRect();
    return { text: h3.textContent, fontSize: cs.fontSize, fontWeight: cs.fontWeight, textShadow: cs.textShadow,
             w: +b.width.toFixed(1), h: +b.height.toFixed(1) };
  });
  console.log('食材图鉴', JSON.stringify(r));
  const box = await page.evaluate(() => {
    const h3 = document.getElementById('gacha-dex-modal').querySelector('h3');
    const b = h3.getBoundingClientRect();
    return { x: Math.max(0,b.x-8), y: Math.max(0,b.y-8), width: Math.min(410-b.x+8, b.width+16), height: b.height+16 };
  });
  await page.screenshot({ path: `${OUT}/title-final-dex.png`, clip: box });
  // 整个弹窗头
  const box2 = await page.evaluate(() => {
    const card = document.getElementById('gacha-dex-modal');
    const b = card.getBoundingClientRect();
    return { x: Math.max(0,b.x-6), y: Math.max(0,b.y-6), width: Math.min(410-b.x+6, b.width+12), height: 170 };
  });
  await page.screenshot({ path: `${OUT}/title-final-dex-head.png`, clip: box2 });
  await page.close();
}

// 2) 首页 → 福利中心（共用标题的小字号弹窗）
{
  const page = await browser.newPage({ viewport: { width: 410, height: 900 }, deviceScaleFactor: 4 });
  await page.goto(BASE, { waitUntil: 'commit' });
  await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 25000 }).catch(()=>{});
  await page.waitForSelector('[data-dish-thumb="true"]', { timeout: 25000 }).catch(()=>{});
  await page.waitForTimeout(400);
  await page.click('#nav-tab-home');
  await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 20000 }).catch(()=>{});
  await page.waitForTimeout(1200);
  const clicked = await page.evaluate(() => {
    const el = [...document.querySelectorAll('button,div[role=button],div')]
      .find(d => (d.textContent||'').trim().startsWith('福利中心') && d.getBoundingClientRect().width < 260 && d.getBoundingClientRect().width > 100);
    if (el) { el.click(); return el.textContent.trim().slice(0,20); }
    return null;
  });
  console.log('点击福利卡:', clicked);
  await page.waitForTimeout(1500);
  const r = await page.evaluate(() => {
    const h3s = [...document.querySelectorAll('h3')].filter(h => (h.textContent||'').trim() === '福利中心');
    return h3s.map(h => {
      const cs = getComputedStyle(h);
      return { fontSize: cs.fontSize, textShadow: cs.textShadow };
    });
  });
  console.log('福利中心', JSON.stringify(r));
  const box = await page.evaluate(() => {
    const h3 = [...document.querySelectorAll('h3')].find(h => (h.textContent||'').trim() === '福利中心');
    if (!h3) return null;
    const b = h3.getBoundingClientRect();
    return { x: Math.max(0,b.x-8), y: Math.max(0,b.y-8), width: Math.min(410-b.x+8, b.width+16), height: b.height+16 };
  });
  if (box) await page.screenshot({ path: `${OUT}/title-final-welfare.png`, clip: box });
  await page.close();
}
await browser.close();
