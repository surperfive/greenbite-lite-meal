import { chromium } from 'playwright';
import fs from 'node:fs';

const BASE = process.env.BASE_URL || 'http://localhost:5180';
const OUT = process.env.OUT || 'C:/Users/OOW/Downloads/qing (2)/scripts/_shots';

fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
page.on('console', m => { if (m.type() === 'error') console.log('[console.error]', m.text()); });

await page.goto(BASE, { waitUntil: 'commit' });
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 15000 }).catch(() => {});
await page.waitForSelector('#nav-tab-orders', { timeout: 15000 });

// 切到订单页
await page.click('#nav-tab-orders');
await page.waitForSelector('.brand-loader', { state: 'detached', timeout: 15000 }).catch(() => {});
// 自检：必须出现订单页特征元素
await page.waitForSelector('text=再来一单', { timeout: 15000 });
await page.waitForTimeout(700);

// 全页概览
await page.screenshot({ path: `${OUT}/orders-thumb-big-page.png`, fullPage: false });

// 单卡特写：滚到视口中部再截（贴边元素 locator 截图有裁剪伪影）
const card = page.locator('.bg-white.rounded-\\[20px\\]').first();
await card.scrollIntoViewIfNeeded();
await page.evaluate(() => { const el = document.querySelector('.bg-white.rounded-\\[20px\\]'); if (el) el.scrollIntoView({ block: 'center' }); });
await page.waitForTimeout(400);
await card.screenshot({ path: `${OUT}/orders-thumb-big-card.png` });

// 几何测量：缩略图尺寸 / 顶部青柠带 / 菜品名列宽 / 是否溢出卡片
const geo = await page.evaluate(() => {
  const cardEl = document.querySelector('.bg-white.rounded-\\[20px\\]');
  if (!cardEl) return null;
  const cr = cardEl.getBoundingClientRect();
  const thumb = cardEl.querySelector('.rounded-\\[17px\\]');
  const tr = thumb.getBoundingClientRect();
  // 菜品名 <p>
  const nameP = Array.from(cardEl.querySelectorAll('p')).find(p => p.className.includes('text-[13px]'));
  const nr = nameP.getBoundingClientRect();
  const band = cardEl.querySelector('.h-9');
  const br = band.getBoundingClientRect();
  return {
    card: { w: +cr.width.toFixed(1), h: +cr.height.toFixed(1), top: +cr.top.toFixed(1), bottom: +cr.bottom.toFixed(1) },
    thumb: { w: +tr.width.toFixed(1), h: +tr.height.toFixed(1), top: +(tr.top - cr.top).toFixed(1), bottom: +(tr.bottom - cr.top).toFixed(1) },
    nameCol: { w: +nr.width.toFixed(1), h: +nr.height.toFixed(1), top: +(nr.top - cr.top).toFixed(1) },
    bandBottom: +(br.bottom - cr.top).toFixed(1),
    nameTruncated: nameP.scrollWidth > nameP.clientWidth + 1,
  };
});
console.log('GEO', JSON.stringify(geo, null, 2));

await browser.close();
